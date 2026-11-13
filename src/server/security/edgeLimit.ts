/**
 * R3 — Giới hạn tần suất ở cửa vào Worker bằng binding Rate Limiting của Cloudflare (miễn phí).
 * Bộ đếm dùng chung giữa các bản Worker trong cùng một điểm Cloudflare (khác bộ đếm trong bộ nhớ
 * chỉ của một bản). Theo tài liệu Cloudflare đây là bộ lọc "lỏng": đếm gần đúng, theo từng điểm.
 * Giới hạn chi tiết theo nghiệp vụ trong src/server/api.ts vẫn giữ nguyên, đây là lớp thêm.
 *
 * Nhóm:
 * - auth: đăng nhập, đăng ký, quên/đặt lại mật khẩu, mã email — theo IP.
 * - write: mọi yêu cầu ghi khác (POST/PUT/PATCH/DELETE) — theo IP.
 * - read: còn lại dưới /api — theo IP.
 */

export type EdgeBucket = 'auth' | 'write' | 'read';

export interface RateLimitBinding {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export interface EdgeLimiters {
  RL_AUTH?: RateLimitBinding;
  RL_WRITE?: RateLimitBinding;
  RL_READ?: RateLimitBinding;
}

const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/change-password', '/api/me/email/'];

export function edgeBucket(method: string, pathname: string): EdgeBucket | null {
  if (pathname !== '/api' && !pathname.startsWith('/api/')) return null;
  if (method === 'OPTIONS' || method === 'HEAD') return null;
  if (pathname === '/api/health') return null; // để công cụ giám sát không tự chặn mình
  if (method !== 'GET' && AUTH_PATHS.some((p) => pathname === p || (p.endsWith('/') && pathname.startsWith(p)))) return 'auth';
  return method === 'GET' ? 'read' : 'write';
}

const BINDING: Record<EdgeBucket, keyof EdgeLimiters> = { auth: 'RL_AUTH', write: 'RL_WRITE', read: 'RL_READ' };

/** Trả 429 khi vượt; undefined khi được qua (hoặc chưa có binding — dev/test/Express). */
export async function applyEdgeLimit(env: EdgeLimiters, method: string, pathname: string, clientIp: string): Promise<Response | undefined> {
  const bucket = edgeBucket(method, pathname);
  if (!bucket) return undefined;
  const limiter = env[BINDING[bucket]];
  if (!limiter) return undefined;
  let ok = true;
  try {
    ok = (await limiter.limit({ key: `${bucket}:${clientIp}` })).success;
  } catch (err) {
    // Lỗi phía bộ đếm không được làm sập trang: cho qua, ghi log để xem ở Workers Logs.
    console.warn('[edge-limit] limiter error', bucket, String((err as any)?.message || err));
    return undefined;
  }
  if (ok) return undefined;
  console.warn(`[edge-limit] blocked bucket=${bucket}`);
  return new Response(
    JSON.stringify({
      success: false,
      code: 'TOO_MANY_REQUESTS',
      error: 'TOO_MANY_REQUESTS: Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau 1 phút.',
      retryAfter: 60,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '60', 'Cache-Control': 'no-store' } }
  );
}
