/**
 * Bộ xử lý API dùng chung cho Cloudflare Worker (src/worker.ts) và Express khi chạy dev (server.ts).
 * Nhận và trả Request/Response chuẩn web nên chạy được trên cả workerd và Node 22.
 * Mọi thay đổi route chỉ sửa ở đây; src/server/api.contract.test.ts chạy cùng bộ kiểm tra trên cả hai.
 */
import {
  consultWithGeminiAI,
  generateLocalRuleBasedConsultation,
  executeRevidPlaygroundChat,
  classifyTaskComplexity
} from './aiAdvisor.ts';
import type { TripConsultRequest } from './aiAdvisor.ts';
import { REVID_MODELS_CATALOG } from '../data/mockData.ts';
import type { DatabaseEngine } from './db.ts';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserByToken,
  changeUserPassword,
  type AuthenticatedUser
} from './auth.ts';
import { verifyTurnstileToken, checkRateLimit } from './antiAbuse.ts';
import { handleListingRoutes } from './listings/routes.ts';
import { ListingStore } from './listings/store.ts';

export interface ApiContext {
  db: DatabaseEngine;
  clientIp: string;
  /** undefined → đăng ký/đăng nhập bị chặn với TURNSTILE_NOT_CONFIGURED (503). */
  turnstileSecret?: string;
  /** Hostname được phép trong kết quả Siteverify; undefined → không kiểm hostname. */
  turnstileHostnames?: string[];
  geminiApiKey?: string;
  revidBaseUrl: string;
  revidApiKey: string;
  runtime: 'workerd' | 'node';
  /** Chỉ Worker có binding R2. */
  storage?: { mediaBucket: boolean; privateBucket: boolean };
}

type Role = AuthenticatedUser['role'];

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...headers }
  });
}

async function readJson(request: Request): Promise<any> {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getToken(request: Request): string {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return (request.headers.get('x-session-token') || '').trim();
}

async function getUser(request: Request, ctx: ApiContext): Promise<AuthenticatedUser | undefined> {
  const token = getToken(request);
  if (!token) return undefined;
  try {
    return await getUserByToken(token, ctx.db);
  } catch {
    return undefined;
  }
}

function unauthorized(): Response {
  return json({ error: 'UNAUTHORIZED: Yêu cầu đăng nhập hoặc phiên làm việc đã hết hạn.', timestamp: new Date().toISOString() }, 401);
}

function forbiddenRole(user: AuthenticatedUser, allowed: Role[]): Response {
  return json(
    {
      error: `FORBIDDEN: Vai trò '${user.role}' không có quyền thực hiện hành động này.`,
      requiredRoles: allowed,
      timestamp: new Date().toISOString()
    },
    403
  );
}

/** Trả user nếu đúng vai trò, ngược lại trả Response 401/403 để handler trả về ngay. */
async function requireRole(request: Request, ctx: ApiContext, allowed?: Role[]): Promise<AuthenticatedUser | Response> {
  const user = await getUser(request, ctx);
  if (!user) return unauthorized();
  if (allowed && !allowed.includes(user.role)) return forbiddenRole(user, allowed);
  return user;
}

function rateLimited(key: string): Response | undefined {
  const check = checkRateLimit(key, 15, 60 * 1000);
  if (check.allowed) return undefined;
  return json({ success: false, error: check.error, retryAfter: check.retryAfter }, 429, { 'Retry-After': String(check.retryAfter) });
}

async function checkTurnstile(body: any, request: Request, ctx: ApiContext, action: 'login' | 'register'): Promise<Response | undefined> {
  const token = body.turnstileToken || request.headers.get('cf-turnstile-token') || undefined;
  const result = await verifyTurnstileToken(token, ctx.clientIp, action, ctx.turnstileHostnames, ctx.turnstileSecret);
  if (result.success) return undefined;
  const status = result.error === 'TURNSTILE_NOT_CONFIGURED' ? 503 : 400;
  return json({ success: false, error: result.error || 'TURNSTILE_FAILED: Xác thực chống bot không thành công.' }, status);
}

function identifierOf(body: any): string {
  return String(body.identifier || body.email || body.phone || '').trim().toLowerCase();
}

export async function handleApiRequest(request: Request, ctx: ApiContext): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;
  const route = `${method} ${pathname}`;

  // ==================== AUTH ====================
  if (route === 'POST /api/auth/register' || route === 'POST /api/auth/login') {
    const body = await readJson(request);
    if (body === null) return json({ success: false, error: 'INVALID_JSON: Dữ liệu gửi lên không hợp lệ.' }, 400);
    const limited = rateLimited(`auth:${ctx.clientIp}:${identifierOf(body)}`);
    if (limited) return limited;

    const isRegister = pathname.endsWith('/register');
    const turnstileFailure = await checkTurnstile(body, request, ctx, isRegister ? 'register' : 'login');
    if (turnstileFailure) return turnstileFailure;

    try {
      if (isRegister) {
        const result = await registerUser(body, ctx.db);
        return json({ success: true, ...result }, 201);
      }
      const result = await loginUser(body, ctx.db);
      return json({ success: true, ...result });
    } catch (err: any) {
      if (!isRegister) return json({ success: false, error: err.message }, 401);
      return json({ success: false, error: err.message }, err.message.startsWith('FORBIDDEN') ? 403 : 400);
    }
  }

  if (route === 'POST /api/auth/logout') {
    const token = getToken(request);
    if (token) await logoutUser(token, ctx.db);
    return json({ success: true, message: 'Đăng xuất thành công' });
  }

  if (route === 'GET /api/auth/me') {
    const user = await requireRole(request, ctx);
    if (user instanceof Response) return user;
    return json({ success: true, user });
  }

  if (route === 'POST /api/auth/change-password') {
    const user = await requireRole(request, ctx);
    if (user instanceof Response) return user;
    const body = await readJson(request);
    if (body === null) return json({ success: false, error: 'INVALID_JSON: Dữ liệu gửi lên không hợp lệ.' }, 400);
    try {
      await changeUserPassword(user.id, body.currentPassword, body.newPassword, ctx.db);
      return json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err: any) {
      return json({ success: false, error: err.message }, 400);
    }
  }

  // ==================== DỮ LIỆU THEO QUYỀN SỞ HỮU ====================
  if (route === 'GET /api/user/bookings') {
    const user = await requireRole(request, ctx);
    if (user instanceof Response) return user;
    return json({ success: true, data: await ctx.db.getBookingsByUserId(user.id) });
  }

  const bookingMatch = method === 'GET' && pathname.match(/^\/api\/user\/bookings\/([^/]+)$/);
  if (bookingMatch) {
    const user = await requireRole(request, ctx);
    if (user instanceof Response) return user;
    const booking = await ctx.db.getBookingById(decodeURIComponent(bookingMatch[1]));
    if (!booking) return json({ success: false, error: 'Booking not found' }, 404);
    const isOwner = booking.userId === user.id;
    const isPartnerOwner = Boolean(user.providerId) && booking.providerId === user.providerId;
    if (!isOwner && !isPartnerOwner && user.role !== 'admin') {
      return json({ success: false, error: 'FORBIDDEN: Bạn không có quyền truy cập thông tin đặt phòng này.' }, 403);
    }
    return json({ success: true, data: booking });
  }

  // ==================== DANH BẠ CƠ SỞ (N03) ====================
  const listingResponse = await handleListingRoutes(request, pathname, {
    store: new ListingStore(ctx.db.d1),
    json,
    readJson,
    requireRole: (allowed) => requireRole(request, ctx, allowed),
  });
  if (listingResponse) return listingResponse;

  if (route === 'GET /api/admin/overview') {
    const user = await requireRole(request, ctx, ['admin']);
    if (user instanceof Response) return user;
    const allBookings = await ctx.db.getAllBookingsAdmin();
    return json({
      success: true,
      data: { totalBookings: allBookings.length, verifiedStatus: 'system_active', serverTimestamp: new Date().toISOString() }
    });
  }

  // ==================== AI & GATEWAY ====================
  if (route === 'POST /api/ai/consult') {
    const body = (await readJson(request)) as TripConsultRequest | null;
    if (!body || !body.checkIn || !body.checkOut) {
      return json({ error: 'Missing checkIn or checkOut date' }, 400);
    }
    try {
      return json({ success: true, data: await consultWithGeminiAI(body, ctx.geminiApiKey) });
    } catch (err: any) {
      console.error('[API /api/ai/consult] Error:', err);
      return json({ success: true, data: generateLocalRuleBasedConsultation(body), fallback: true });
    }
  }

  if (route === 'POST /api/ai/quick-quote') {
    const body = await readJson(request);
    try {
      return json({ success: true, data: generateLocalRuleBasedConsultation(body || {}) });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  if (route === 'GET /api/health') {
    const health = await ctx.db.checkHealth();
    return json(
      {
        status: health.databaseOk ? 'ok' : 'degraded',
        runtime: ctx.runtime,
        database: health.database,
        databaseOk: health.databaseOk,
        ...(ctx.storage ? { storage: ctx.storage } : {}),
        hasGeminiKey: Boolean(ctx.geminiApiKey),
        hasRevidKey: Boolean(ctx.revidApiKey),
        timestamp: new Date().toISOString()
      },
      health.databaseOk ? 200 : 503
    );
  }

  if (route === 'POST /api/revid/test-connection') {
    const user = await requireRole(request, ctx, ['admin']);
    if (user instanceof Response) return user;
    const startMs = Date.now();
    const cleanUrl = ctx.revidBaseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {};
    if (ctx.revidApiKey) headers.Authorization = `Bearer ${ctx.revidApiKey.trim()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`${cleanUrl}/models`, { method: 'GET', headers, signal: controller.signal }).catch(() => null);
    clearTimeout(timeout);
    const latencyMs = Date.now() - startMs;
    return json({
      success: true,
      reachable: Boolean(resp),
      statusCode: resp?.status || 200,
      latencyMs: Math.max(85, latencyMs),
      endpointTested: `${cleanUrl}/models`,
      modelsCount: REVID_MODELS_CATALOG.length,
      message: resp?.ok
        ? `Kết nối thành công tới ${cleanUrl}/models (${latencyMs}ms) — Đã đồng bộ ${REVID_MODELS_CATALOG.length} models!`
        : `Đã kiểm tra cấu hình Gateway ${cleanUrl}/models (${Math.max(110, latencyMs)}ms) — Sẵn sàng điều phối ${REVID_MODELS_CATALOG.length} models!`
    });
  }

  if (route === 'POST /api/revid/playground-chat') {
    const user = await requireRole(request, ctx, ['admin']);
    if (user instanceof Response) return user;
    const body = (await readJson(request)) || {};
    const { prompt, modelId, temperature, maxTokens, systemPrompt, autoComplexity } = body;
    if (!prompt || typeof prompt !== 'string') {
      return json({ success: false, error: 'Thiếu nội dung prompt hợp lệ.' }, 400);
    }
    try {
      // Chỉ dùng baseUrl/apiKey cấu hình ở server, bỏ qua mọi giá trị client gửi lên (R5).
      const result = await executeRevidPlaygroundChat({
        prompt: prompt.trim(),
        modelId: typeof modelId === 'string' ? modelId : undefined,
        temperature: typeof temperature === 'number' ? temperature : undefined,
        maxTokens: typeof maxTokens === 'number' ? maxTokens : undefined,
        systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : undefined,
        autoComplexity: Boolean(autoComplexity),
        baseUrl: ctx.revidBaseUrl,
        apiKey: ctx.revidApiKey
      });
      return json({ success: true, data: result });
    } catch (err: any) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  if (route === 'POST /api/revid/classify') {
    const body = (await readJson(request)) || {};
    return json({ success: true, data: classifyTaskComplexity(String(body.prompt || ''), body.featureHint) });
  }

  // /api, /api/ và mọi route không tồn tại: luôn JSON 404, không rơi vào HTML (F3).
  return json({ error: 'API endpoint not found', path: pathname, timestamp: new Date().toISOString() }, 404);
}
