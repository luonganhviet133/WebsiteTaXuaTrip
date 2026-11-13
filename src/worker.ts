/**
 * Cloudflare Worker Entry Point for Tà Xùa Trip
 * Target Architecture: Cloudflare Workers + Static Assets + D1 + R2
 *
 * Implements:
 * - API: chuyển toàn bộ /api/* cho bộ xử lý chung src/server/api.ts (G0.4)
 * - Static Assets fallback with SPA routing and source path protection (N02.4)
 */

import { DatabaseEngine } from './server/db.ts';
import { TURNSTILE_TEST_SECRET } from './server/antiAbuse.ts';
import { handleApiRequest } from './server/api.ts';
import { HoldStore } from './server/bookings/holds.ts';
import { PaymentStore } from './server/payments/store.ts';
import { R2Storage } from './server/payments/storage.ts';
import { CloudflareEmailSender } from './server/email.ts';
import { withSecurityHeaders } from './server/security/headers.ts';
import { applyEdgeLimit, type EdgeLimiters } from './server/security/edgeLimit.ts';
import { accessConfigFrom, enforceAccess } from './server/security/access.ts';
import { D1Backup } from './server/backup/d1Backup.ts';

const WEEKLY_BACKUP_CRON = '17 20 * * 6';

export interface Env extends EdgeLimiters {
  DB: any;
  MEDIA_BUCKET?: any;
  PRIVATE_BUCKET?: any;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  TURNSTILE_SECRET_KEY?: string;
  GEMINI_API_KEY?: string;
  REVID_BASE_URL?: string;
  REVID_API_KEY?: string;
  NODE_ENV?: string;
  /** R1: binding send_email (chỉ có sau khi nâng Workers Paid và bật gửi email cho taxuatrip.vn). */
  EMAIL?: { send(m: any): Promise<any> };
  /** Địa chỉ gửi, vd "Tà Xùa Trip <no-reply@taxuatrip.vn>". */
  MAIL_FROM?: string;
  /** R3: Cloudflare Access cho trang quản trị — chỉ bật khi đặt cả hai (sau khi có tên miền). */
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

const fetchJson = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

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
  // N05.2 — Cron (wrangler.toml [triggers]) mỗi 5 phút: chuyển giữ chỗ quá hạn sang 'expired' và nhả phòng.
  // Tồn phòng không phụ thuộc cron (giữ chỗ hết hạn tự không được tính); cron chỉ dọn trạng thái cho đúng.
  async scheduled(event: { cron?: string } | undefined, env: Env): Promise<void> {
    const d1 = new DatabaseEngine({ d1: env.DB }).d1;
    // R3: sao lưu D1 sang R2 riêng tư — bắt đầu 03:17 Chủ nhật (giờ VN), mỗi lần cron 5 phút chạy tiếp một bước nhỏ.
    if (env.PRIVATE_BUCKET) {
      try {
        const backup = new D1Backup(d1, env.PRIVATE_BUCKET);
        if (event?.cron === WEEKLY_BACKUP_CRON) await backup.start('weekly');
        const r = await backup.step();
        if (r !== 'idle') console.log(`[backup] ${r}`);
      } catch (err: any) {
        console.error('[backup] error', String(err?.message || err));
      }
      if (event?.cron === WEEKLY_BACKUP_CRON) return;
    }
    const result = await new HoldStore(d1).expireHolds();
    if (result.expired || result.released) console.log(`[holds] expired=${result.expired} released=${result.released}`);
    // N06.1: nhắc khách trả 70% ở mốc 48 giờ và 30 giờ trước giờ nhận phòng (mỗi mốc một lần).
    const payments = new PaymentStore(d1);
    const reminders = await payments.sendBalanceReminders();
    if (reminders) console.log(`[payments] balance_reminders=${reminders}`);
    // Đối soát cọc quá hạn 3 ngày chưa hoàn: báo khách và chủ cơ sở (mỗi hạn một lần).
    const overdue = await payments.sendReconciliationReminders();
    if (overdue) console.log(`[payments] reconciliation_overdue=${overdue}`);
  },

  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    // R3: mọi phản hồi do Worker tạo đều có header bảo mật (tệp tĩnh dùng public/_headers).
    return withSecurityHeaders(await handle(request, env, ctx));
  }
};

async function handle(request: Request, env: Env, _ctx?: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const clientIp = getClientIp(request);

    // R3: Cloudflare Access cho /quan-tri và /api/admin (tắt khi chưa cấu hình).
    const denied = await enforceAccess(request, pathname, accessConfigFrom(env), fetchJson);
    if (denied) return denied;

    // R3: giới hạn tần suất ở cửa vào bằng binding Rate Limiting (bỏ qua khi chưa có binding).
    const limited = await applyEdgeLimit(env, request.method, pathname, clientIp);
    if (limited) return limited;

    // 1. API: dùng chung bộ xử lý với Express (src/server/api.ts)
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return handleApiRequest(request, {
        db: new DatabaseEngine({ d1: env.DB }),
        privateStorage: env.PRIVATE_BUCKET ? new R2Storage(env.PRIVATE_BUCKET) : undefined,
        email: env.EMAIL ? new CloudflareEmailSender(env.EMAIL, env.MAIL_FROM || 'Tà Xùa Trip <no-reply@taxuatrip.vn>') : undefined,
        clientIp,
        turnstileSecret: getTurnstileSecret(env),
        turnstileHostnames: [url.hostname],
        geminiApiKey: env.GEMINI_API_KEY,
        revidBaseUrl: env.REVID_BASE_URL || 'https://ai.revidapi.com/v1',
        revidApiKey: env.REVID_API_KEY || '',
        runtime: 'workerd',
        storage: { mediaBucket: Boolean(env.MEDIA_BUCKET), privateBucket: Boolean(env.PRIVATE_BUCKET) },
        backupBucket: env.PRIVATE_BUCKET
      });
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
          // Lấy "/" chứ không lấy "/index.html": Assets chuyển hướng /index.html → / (307),
          // khiến mọi đường dẫn như /co-so/:id bị đá về trang chủ khi tải lại.
          const indexUrl = new URL('/', request.url);
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
