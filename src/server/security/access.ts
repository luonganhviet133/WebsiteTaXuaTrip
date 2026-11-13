/**
 * R3 — Lớp bảo vệ thứ hai cho trang quản trị bằng Cloudflare Access (Zero Trust, miễn phí tới 50 người).
 * TẮT cho tới khi đặt cả hai biến ACCESS_TEAM_DOMAIN và ACCESS_AUD (sau khi có tên miền taxuatrip.vn và tạo
 * ứng dụng Access cho /quan-tri và /api/admin — xem docs/implementation/UPGRADE_RUNBOOK.md).
 * Khi bật: Worker tự kiểm chữ ký JWT Access (RS256, khóa công khai của nhóm), hạn, issuer, audience.
 * Không thay thế đăng nhập của web: vẫn phải là tài khoản admin.
 */

export interface AccessConfig {
  /** vd "taxuatrip.cloudflareaccess.com" (không có https://). */
  teamDomain: string;
  /** Application Audience (AUD) Tag của ứng dụng Access. */
  aud: string;
}

export type FetchJson = (url: string) => Promise<any>;

const ADMIN_PATHS = [/^\/quan-tri(\/|$)/, /^\/api\/admin(\/|$)/];

export function isAccessProtectedPath(pathname: string): boolean {
  return ADMIN_PATHS.some((re) => re.test(pathname));
}

export function accessConfigFrom(env: { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string }): AccessConfig | null {
  const teamDomain = (env.ACCESS_TEAM_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const aud = (env.ACCESS_AUD || '').trim();
  return teamDomain && aud ? { teamDomain, aud } : null;
}

const b64urlToBytes = (s: string): Uint8Array<ArrayBuffer> => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

// Khóa công khai đổi định kỳ; nhớ trong bản Worker 10 phút, gặp kid lạ thì tải lại.
let jwksCache: { url: string; keys: any[]; at: number } | null = null;
export function resetAccessKeyCache() {
  jwksCache = null;
}

async function keyFor(kid: string, cfg: AccessConfig, fetchJson: FetchJson, now: number) {
  const url = `https://${cfg.teamDomain}/cdn-cgi/access/certs`;
  const fresh = jwksCache && jwksCache.url === url && now - jwksCache.at < 10 * 60_000;
  let jwk = fresh ? jwksCache!.keys.find((k) => k.kid === kid) : undefined;
  if (!jwk) {
    const body = await fetchJson(url);
    jwksCache = { url, keys: Array.isArray(body?.keys) ? body.keys : [], at: now };
    jwk = jwksCache.keys.find((k) => k.kid === kid);
  }
  if (!jwk) return null;
  return crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

export type AccessResult = { ok: true; email: string | null } | { ok: false; reason: string };

export async function verifyAccessJwt(token: string | null, cfg: AccessConfig, fetchJson: FetchJson, nowMs = Date.now()): Promise<AccessResult> {
  if (!token) return { ok: false, reason: 'missing' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  let header: any, payload: any;
  try {
    header = b64urlJson(parts[0]);
    payload = b64urlJson(parts[1]);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (header.alg !== 'RS256' || !header.kid) return { ok: false, reason: 'alg' };
  let key: CryptoKey | null;
  try {
    key = await keyFor(String(header.kid), cfg, fetchJson, nowMs);
  } catch {
    return { ok: false, reason: 'certs_unavailable' };
  }
  if (!key) return { ok: false, reason: 'unknown_key' };
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) return { ok: false, reason: 'signature' };
  const nowSec = Math.floor(nowMs / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < nowSec - 30) return { ok: false, reason: 'expired' };
  if (typeof payload.nbf === 'number' && payload.nbf > nowSec + 30) return { ok: false, reason: 'not_yet_valid' };
  if (payload.iss !== `https://${cfg.teamDomain}`) return { ok: false, reason: 'issuer' };
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(cfg.aud)) return { ok: false, reason: 'audience' };
  return { ok: true, email: typeof payload.email === 'string' ? payload.email : null };
}

/** Dùng trong Worker: trả 403 khi đường dẫn quản trị thiếu/sai Access; undefined khi được qua hoặc Access đang tắt. */
export async function enforceAccess(request: Request, pathname: string, cfg: AccessConfig | null, fetchJson: FetchJson): Promise<Response | undefined> {
  if (!cfg || !isAccessProtectedPath(pathname)) return undefined;
  const r = await verifyAccessJwt(request.headers.get('cf-access-jwt-assertion'), cfg, fetchJson);
  if (r.ok) return undefined;
  console.warn(`[access] denied path=${pathname} reason=${r.reason}`);
  const isApi = pathname.startsWith('/api/');
  return new Response(
    isApi
      ? JSON.stringify({ success: false, code: 'ACCESS_REQUIRED', error: 'ACCESS_REQUIRED: Trang quản trị cần xác thực Cloudflare Access.' })
      : 'Trang quản trị cần xác thực Cloudflare Access.',
    { status: 403, headers: { 'Content-Type': isApi ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}
