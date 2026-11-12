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

export interface Env {
  DB: any;
  MEDIA_BUCKET?: any;
  PRIVATE_BUCKET?: any;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  TURNSTILE_SECRET_KEY?: string;
  GEMINI_API_KEY?: string;
  REVID_BASE_URL?: string;
  REVID_API_KEY?: string;
  NODE_ENV?: string;
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

    // 1. API: dùng chung bộ xử lý với Express (src/server/api.ts)
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return handleApiRequest(request, {
        db: new DatabaseEngine({ d1: env.DB }),
        clientIp: getClientIp(request),
        turnstileSecret: getTurnstileSecret(env),
        turnstileHostnames: [url.hostname],
        geminiApiKey: env.GEMINI_API_KEY,
        revidBaseUrl: env.REVID_BASE_URL || 'https://ai.revidapi.com/v1',
        revidApiKey: env.REVID_API_KEY || '',
        runtime: 'workerd',
        storage: { mediaBucket: Boolean(env.MEDIA_BUCKET), privateBucket: Boolean(env.PRIVATE_BUCKET) }
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
};
