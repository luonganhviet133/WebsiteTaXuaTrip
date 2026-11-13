import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECURITY_HEADERS, headersFileContent, withSecurityHeaders, CSP_REPORT_ONLY } from './headers.ts';
import { edgeBucket, applyEdgeLimit, type RateLimitBinding } from './edgeLimit.ts';
import { accessConfigFrom, enforceAccess, isAccessProtectedPath, resetAccessKeyCache, verifyAccessJwt } from './access.ts';
import { EXPECTED_MIGRATION, schemaStatus } from '../schemaVersion.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('Header bảo mật: public/_headers khớp hằng số; phản hồi Worker có đủ header, không ghi đè header riêng', async () => {
  assert.equal(fs.readFileSync(path.join(root, 'public/_headers'), 'utf8'), headersFileContent(), 'chạy npm run gen:headers để sinh lại public/_headers');
  const r = withSecurityHeaders(new Response('{"a":1}', { status: 201, headers: { 'Content-Type': 'application/json', 'Content-Security-Policy': "default-src 'none'" } }));
  assert.equal(r.status, 201);
  assert.equal(await r.text(), '{"a":1}');
  assert.equal(r.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(r.headers.get('Content-Security-Policy'), "default-src 'none'", 'giữ CSP riêng của phản hồi');
  assert.match(r.headers.get('Strict-Transport-Security') || '', /max-age=31536000/);
  assert.equal(new Response(null, { status: 204 }).status, withSecurityHeaders(new Response(null, { status: 204 })).status);
  assert.ok(!/unsafe-inline/.test(CSP_REPORT_ONLY.split('; ').find((d) => d.startsWith('script-src'))!), 'không cho script nội tuyến');
  assert.match(SECURITY_HEADERS['Content-Security-Policy'], /frame-ancestors 'none'/);
});

test('index.html không còn script nội tuyến (để CSP không cần unsafe-inline)', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => !/application\/ld\+json/.test(m[1]) && m[2].trim());
  assert.deepEqual(inline.map((m) => m[2].slice(0, 40)), []);
});

test('Nhóm giới hạn: đăng nhập/đăng ký/mật khẩu/mã email là auth; ghi khác là write; GET là read; health và trang không tính', () => {
  assert.equal(edgeBucket('POST', '/api/auth/login'), 'auth');
  assert.equal(edgeBucket('POST', '/api/auth/register'), 'auth');
  assert.equal(edgeBucket('POST', '/api/auth/reset-password'), 'auth');
  assert.equal(edgeBucket('POST', '/api/me/email/verify'), 'auth');
  assert.equal(edgeBucket('POST', '/api/bookings'), 'write');
  assert.equal(edgeBucket('DELETE', '/api/me/sessions/x'), 'write');
  assert.equal(edgeBucket('GET', '/api/listings'), 'read');
  assert.equal(edgeBucket('GET', '/api/auth/me'), 'read');
  assert.equal(edgeBucket('GET', '/api/health'), null);
  assert.equal(edgeBucket('GET', '/quan-tri'), null);
  assert.equal(edgeBucket('OPTIONS', '/api/bookings'), null);
});

test('applyEdgeLimit: khóa theo nhóm + IP; vượt thì 429 có Retry-After; không có binding hoặc binding lỗi thì cho qua', async () => {
  const seen: string[] = [];
  let allow = true;
  const fake: RateLimitBinding = { limit: async ({ key }) => (seen.push(key), { success: allow }) };
  assert.equal(await applyEdgeLimit({ RL_AUTH: fake }, 'POST', '/api/auth/login', '1.2.3.4'), undefined);
  assert.deepEqual(seen, ['auth:1.2.3.4']);
  allow = false;
  const blocked = await applyEdgeLimit({ RL_AUTH: fake }, 'POST', '/api/auth/login', '1.2.3.4');
  assert.equal(blocked?.status, 429);
  assert.equal(blocked?.headers.get('Retry-After'), '60');
  assert.equal(((await blocked!.json()) as any).code, 'TOO_MANY_REQUESTS');
  assert.equal(await applyEdgeLimit({}, 'POST', '/api/auth/login', '1.2.3.4'), undefined, 'dev/test không có binding');
  const broken: RateLimitBinding = { limit: async () => { throw new Error('down'); } };
  assert.equal(await applyEdgeLimit({ RL_WRITE: broken }, 'POST', '/api/bookings', '1.2.3.4'), undefined, 'lỗi bộ đếm không làm sập trang');
});

// ---------- Cloudflare Access ----------
const TEAM = 'taxuatrip.cloudflareaccess.com';
const AUD = 'aud-tag-123';
const b64url = (b: ArrayBuffer | Uint8Array | string) =>
  Buffer.from(typeof b === 'string' ? b : b instanceof Uint8Array ? b : new Uint8Array(b)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function keyset() {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as any;
  const sign = async (payload: any, kid = 'k1', alg = 'RS256') => {
    const head = b64url(JSON.stringify({ alg, kid, typ: 'JWT' }));
    const body = b64url(JSON.stringify(payload));
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${head}.${body}`));
    return `${head}.${body}.${b64url(sig)}`;
  };
  return { jwks: { keys: [{ ...jwk, kid: 'k1' }] }, sign };
}

test('Access JWT: đúng chữ ký/issuer/audience/hạn thì qua; sai bất kỳ thì từ chối', async () => {
  resetAccessKeyCache();
  const { jwks, sign } = await keyset();
  const other = await keyset();
  let fetches = 0;
  const fetchJson = async (url: string) => {
    fetches++;
    assert.equal(url, `https://${TEAM}/cdn-cgi/access/certs`);
    return jwks;
  };
  const cfg = { teamDomain: TEAM, aud: AUD };
  const now = Date.now();
  const good = { aud: [AUD], iss: `https://${TEAM}`, exp: Math.floor(now / 1000) + 600, nbf: Math.floor(now / 1000) - 10, email: 'vanhuy171099@gmail.com' };
  assert.deepEqual(await verifyAccessJwt(await sign(good), cfg, fetchJson, now), { ok: true, email: 'vanhuy171099@gmail.com' });
  await verifyAccessJwt(await sign(good), cfg, fetchJson, now);
  assert.equal(fetches, 1, 'khóa công khai được nhớ, không tải lại mỗi yêu cầu');
  const reason = async (t: string | null) => ((await verifyAccessJwt(t, cfg, fetchJson, now)) as any).reason;
  assert.equal(await reason(null), 'missing');
  assert.equal(await reason('abc'), 'malformed');
  assert.equal(await reason(await other.sign(good)), 'signature', 'ký bằng khóa khác');
  assert.equal(await reason(await sign({ ...good, aud: ['khac'] })), 'audience');
  assert.equal(await reason(await sign({ ...good, iss: 'https://evil.cloudflareaccess.com' })), 'issuer');
  assert.equal(await reason(await sign({ ...good, exp: Math.floor(now / 1000) - 3600 })), 'expired');
  assert.equal(await reason(await sign(good, 'k-la')), 'unknown_key');
  const [h, p, s] = (await sign(good)).split('.');
  const tampered = `${h}.${b64url(JSON.stringify({ ...good, email: 'hacker@gmail.com' }))}.${s}`;
  assert.equal(await reason(tampered), 'signature', 'sửa nội dung thì chữ ký sai');
  void p;
});

test('Access: tắt khi chưa cấu hình; bật thì chặn /quan-tri và /api/admin, không đụng trang khác', async () => {
  resetAccessKeyCache();
  assert.equal(accessConfigFrom({}), null);
  assert.equal(accessConfigFrom({ ACCESS_TEAM_DOMAIN: 'x.cloudflareaccess.com' }), null, 'thiếu AUD thì vẫn tắt');
  assert.deepEqual(accessConfigFrom({ ACCESS_TEAM_DOMAIN: 'https://x.cloudflareaccess.com/', ACCESS_AUD: ' a ' }), { teamDomain: 'x.cloudflareaccess.com', aud: 'a' });
  assert.ok(isAccessProtectedPath('/quan-tri'));
  assert.ok(isAccessProtectedPath('/api/admin/members/u1/lock'));
  assert.ok(!isAccessProtectedPath('/quan-tri-vien-gia'));
  assert.ok(!isAccessProtectedPath('/api/listings'));
  const req = (p: string, jwt?: string) => new Request(`https://taxuatrip.vn${p}`, { headers: jwt ? { 'cf-access-jwt-assertion': jwt } : {} });
  const never = async () => { throw new Error('không được gọi'); };
  assert.equal(await enforceAccess(req('/api/admin/members'), '/api/admin/members', null, never), undefined, 'tắt thì cho qua');
  const { jwks, sign } = await keyset();
  const cfg = { teamDomain: TEAM, aud: AUD };
  assert.equal(await enforceAccess(req('/api/listings'), '/api/listings', cfg, never), undefined);
  const denied = await enforceAccess(req('/api/admin/members'), '/api/admin/members', cfg, async () => jwks);
  assert.equal(denied?.status, 403);
  assert.equal(((await denied!.json()) as any).code, 'ACCESS_REQUIRED');
  const t = await sign({ aud: AUD, iss: `https://${TEAM}`, exp: Math.floor(Date.now() / 1000) + 600 });
  assert.equal(await enforceAccess(req('/quan-tri', t), '/quan-tri', cfg, async () => jwks), undefined);
});

test('Phiên bản cấu trúc D1: khớp migration mới nhất; health báo lệch khi production thiếu migration', async () => {
  const files = fs.readdirSync(path.join(root, 'migrations_d1')).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  assert.equal(EXPECTED_MIGRATION, files[files.length - 1], 'thêm migration mới thì cập nhật src/server/schemaVersion.ts');
  const fake = (name: string | null, throws = false) => ({
    prepare: () => ({ first: async () => { if (throws) throw new Error('no such table: d1_migrations'); return name ? { name } : null; } }),
  });
  assert.equal((await schemaStatus(fake(EXPECTED_MIGRATION))).ok, true);
  assert.equal((await schemaStatus(fake('0011_reviews_complaints.sql'))).ok, false);
  assert.deepEqual(await schemaStatus(fake(null, true)), { expected: EXPECTED_MIGRATION, applied: null, ok: true });
});

test('Cron sao lưu hằng tuần: khớp giữa wrangler.toml và worker; dùng SAT (Cloudflare: 1=Chủ nhật…7=thứ Bảy)', () => {
  const toml = fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'src/worker.ts'), 'utf8');
  const weekly = /const WEEKLY_BACKUP_CRON = '([^']+)'/.exec(worker)?.[1];
  assert.equal(weekly, '17 20 * * SAT');
  assert.ok(toml.includes(`"${weekly}"`), 'wrangler.toml phải có đúng chuỗi cron mà worker so sánh');
});
