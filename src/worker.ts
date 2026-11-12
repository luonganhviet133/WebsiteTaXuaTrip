/**
 * Cloudflare Worker Entry Point for Tà Xùa Trip
 * Target Architecture: Cloudflare Workers + Static Assets + D1 + R2
 *
 * Implements:
 * - API request handling on Cloudflare D1 with prepared statements (N02.1 - N02.3)
 * - Anti-abuse: Server-side Turnstile verification + Rate limiting (N02.5)
 * - Strict JSON 404 for bare /api and invalid /api/* endpoints (Regression F3)
 * - Static Assets fallback with SPA routing and source path protection (N02.4)
 */

import { DatabaseEngine } from './server/db.ts';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserByToken,
  changeUserPassword
} from './server/auth.ts';
import { verifyTurnstileToken, checkRateLimit, TURNSTILE_TEST_SECRET } from './server/antiAbuse.ts';

export interface Env {
  DB: any;
  MEDIA_BUCKET?: any;
  PRIVATE_BUCKET?: any;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  TURNSTILE_SECRET_KEY?: string;
  GEMINI_API_KEY?: string;
  NODE_ENV?: string;
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7).trim();
}

// Secret Turnstile từ binding của Worker (Settings → Variables and Secrets).
// Production thiếu secret thì trả undefined để chặn đăng ký/đăng nhập; dev/test dùng secret test.
function getTurnstileSecret(env: Env): string | undefined {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY;
  return env.NODE_ENV === 'production' ? undefined : TURNSTILE_TEST_SECRET;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const clientIp = getClientIp(request);

    // 1. API Route Handling
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      // Initialize D1 database engine
      const db = new DatabaseEngine({ d1: env.DB });

      // GET /api/health
      if (pathname === '/api/health' && request.method === 'GET') {
        try {
          const health = await db.checkHealth();
          return jsonResponse({
            status: health.databaseOk ? 'ok' : 'degraded',
            environment: env.NODE_ENV || 'production',
            runtime: 'workerd',
            database: {
              engine: 'Cloudflare D1 (SQLite)',
              status: health.databaseOk ? 'connected' : 'error',
              error: health.error
            },
            storage: {
              mediaBucket: env.MEDIA_BUCKET ? 'bound' : 'unbound',
              privateBucket: env.PRIVATE_BUCKET ? 'bound' : 'unbound'
            },
            timestamp: new Date().toISOString()
          }, health.databaseOk ? 200 : 503);
        } catch (err: any) {
          return jsonResponse({
            status: 'error',
            error: err.message
          }, 500);
        }
      }

      // POST /api/auth/register
      if (pathname === '/api/auth/register' && request.method === 'POST') {
        const rateCheck = checkRateLimit(`auth:${clientIp}`, 15, 60 * 1000);
        if (!rateCheck.allowed) {
          return jsonResponse({
            success: false,
            error: rateCheck.error,
            retryAfter: rateCheck.retryAfter
          }, 429, { 'Retry-After': String(rateCheck.retryAfter) });
        }

        try {
          const body: any = await request.json();
          const turnstileToken = body.turnstileToken || request.headers.get('cf-turnstile-token');
          const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp, 'register', [url.hostname], getTurnstileSecret(env));
          if (!turnstileCheck.success) {
            return jsonResponse({
              success: false,
              error: turnstileCheck.error || 'Xác thực Turnstile không thành công.'
            }, turnstileCheck.error === 'TURNSTILE_NOT_CONFIGURED' ? 503 : 400);
          }

          const result = await registerUser(body, db);
          return jsonResponse({
            success: true,
            user: result.user,
            token: result.token
          }, 201);
        } catch (err: any) {
          return jsonResponse({
            success: false,
            error: err.message
          }, 400);
        }
      }

      // POST /api/auth/login
      if (pathname === '/api/auth/login' && request.method === 'POST') {
        const rateCheck = checkRateLimit(`auth:${clientIp}`, 15, 60 * 1000);
        if (!rateCheck.allowed) {
          return jsonResponse({
            success: false,
            error: rateCheck.error,
            retryAfter: rateCheck.retryAfter
          }, 429, { 'Retry-After': String(rateCheck.retryAfter) });
        }

        try {
          const body: any = await request.json();
          const identifier = body.identifier || body.email || body.phone;
          const password = body.password;
          const turnstileToken = body.turnstileToken || request.headers.get('cf-turnstile-token');

          const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp, 'login', [url.hostname], getTurnstileSecret(env));
          if (!turnstileCheck.success) {
            return jsonResponse({
              success: false,
              error: turnstileCheck.error || 'Xác thực Turnstile không thành công.'
            }, turnstileCheck.error === 'TURNSTILE_NOT_CONFIGURED' ? 503 : 400);
          }

          const result = await loginUser({ identifier, password }, db);
          return jsonResponse({
            success: true,
            user: result.user,
            token: result.token
          }, 200);
        } catch (err: any) {
          return jsonResponse({
            success: false,
            error: err.message
          }, 401);
        }
      }

      // POST /api/auth/logout
      if (pathname === '/api/auth/logout' && request.method === 'POST') {
        const token = getBearerToken(request);
        if (token) {
          await logoutUser(token, db);
        }
        return jsonResponse({ success: true, message: 'Đăng xuất thành công' }, 200);
      }

      // GET /api/auth/me
      if (pathname === '/api/auth/me' && request.method === 'GET') {
        const token = getBearerToken(request);
        if (!token) {
          return jsonResponse({ success: false, error: 'Chưa đăng nhập' }, 401);
        }
        const user = await getUserByToken(token, db);
        if (!user) {
          return jsonResponse({ success: false, error: 'Phiên làm việc đã hết hạn hoặc bị thu hồi' }, 401);
        }
        return jsonResponse({ success: true, user }, 200);
      }

      // POST /api/auth/change-password
      if (pathname === '/api/auth/change-password' && request.method === 'POST') {
        const token = getBearerToken(request);
        if (!token) {
          return jsonResponse({ success: false, error: 'Chưa đăng nhập' }, 401);
        }
        const user = await getUserByToken(token, db);
        if (!user) {
          return jsonResponse({ success: false, error: 'Phiên làm việc đã hết hạn' }, 401);
        }
        try {
          const body: any = await request.json();
          await changeUserPassword(user.id, body.currentPassword, body.newPassword, db);
          return jsonResponse({ success: true, message: 'Đổi mật khẩu thành công' }, 200);
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 400);
        }
      }

      // GET /api/user/bookings
      if (pathname === '/api/user/bookings' && request.method === 'GET') {
        const token = getBearerToken(request);
        if (!token) {
          return jsonResponse({ success: false, error: 'Chưa đăng nhập' }, 401);
        }
        const user = await getUserByToken(token, db);
        if (!user) {
          return jsonResponse({ success: false, error: 'Phiên làm việc không hợp lệ' }, 401);
        }
        const bookings = await db.getBookingsByUserId(user.id);
        return jsonResponse({ success: true, data: bookings }, 200);
      }

      // GET /api/partner/listings
      if (pathname === '/api/partner/listings' && request.method === 'GET') {
        const token = getBearerToken(request);
        if (!token) {
          return jsonResponse({ success: false, error: 'Chưa đăng nhập' }, 401);
        }
        const user = await getUserByToken(token, db);
        if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
          return jsonResponse({ success: false, error: 'Không có quyền truy cập cơ sở đối tác' }, 403);
        }
        const listingIds = await db.getOwnedListingIdsByUserId(user.id);
        return jsonResponse({ success: true, data: listingIds }, 200);
      }

      // GET /api/admin/overview
      if (pathname === '/api/admin/overview' && request.method === 'GET') {
        const token = getBearerToken(request);
        if (!token) {
          return jsonResponse({ success: false, error: 'Chưa đăng nhập' }, 401);
        }
        const user = await getUserByToken(token, db);
        if (!user || user.role !== 'admin') {
          return jsonResponse({ success: false, error: 'Yêu cầu quyền Quản trị viên' }, 403);
        }
        const overview = await db.getAdminOverview();
        return jsonResponse({ success: true, data: overview }, 200);
      }

      // F3: Strict JSON 404 for bare /api and invalid /api/* endpoints
      return jsonResponse({
        success: false,
        error: 'API_ENDPOINT_NOT_FOUND',
        message: `API endpoint '${pathname}' không tồn tại trên hệ thống.`
      }, 404);
    }

    // 2. Security Guard: Never serve server source files, env files, or bundles
    if (
      pathname === '/server.ts' ||
      pathname.startsWith('/src/') ||
      pathname.includes('.env') ||
      pathname === '/wrangler.toml' ||
      pathname.includes('..')
    ) {
      return new Response('404 Not Found', { status: 404 });
    }

    // 3. Static Assets Serving via Cloudflare Workers Static Assets binding
    if (env.ASSETS) {
      let assetResponse = await env.ASSETS.fetch(request);
      // SPA Fallback: if asset not found and requesting an HTML page, serve index.html
      if (assetResponse.status === 404 && request.method === 'GET') {
        const accept = request.headers.get('accept') || '';
        if (accept.includes('text/html')) {
          const indexUrl = new URL('/index.html', request.url);
          assetResponse = await env.ASSETS.fetch(new Request(indexUrl, request));
        }
      }
      return assetResponse;
    }

    return new Response('Tà Xùa Trip Worker active. No static assets binding found.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
