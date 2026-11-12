/**
 * G0.4 — Hợp đồng API: cùng một bộ kiểm tra chạy trên Express (Node, dùng khi dev)
 * và trên Worker (workerd, chính là bản deploy lên Cloudflare). Hai bên phải trả giống nhau.
 *
 * Không gọi dịch vụ trả phí: không có GEMINI_API_KEY/REVID_API_KEY nên AI chạy bộ quy tắc nội bộ;
 * không gọi /api/revid/test-connection bằng quyền admin (route này gọi mạng ra ngoài).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { unstable_dev } from 'wrangler';
import { createExpressApp } from '../../server.ts';
import { DatabaseEngine } from './db.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Dùng dist/client đã build sẵn (`npm run build` chạy trước `npm test`), không build lại khi khởi động Worker:
// build lại sẽ xóa dist/client trong lúc các file test khác đang phục vụ thư mục này.
process.env.SKIP_CLIENT_BUILD = '1';
if (!fs.existsSync(path.join(projectRoot, 'dist/client/index.html'))) {
  throw new Error('Thiếu dist/client: chạy `npm run build` trước khi chạy test Worker.');
}

type Fetcher = (route: string, init?: RequestInit) => Promise<Response>;

function jsonInit(method: string, body: unknown, token?: string): RequestInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { method, headers, body: JSON.stringify(body) };
}

function authInit(token: string, method = 'GET'): RequestInit {
  return { method, headers: { Authorization: `Bearer ${token}` } };
}

async function runContract(t: any, call: Fetcher, label: string): Promise<void> {
  const email = `contract.${label}.${Date.now()}@example.com`;
  const password = 'MatKhau123!';
  let token = '';

  await t.test('GET /api/health trả 200, status ok', async () => {
    const res = await call('/api/health');
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.status, 'ok');
  });

  await t.test('Route API không tồn tại trả 404 JSON', async () => {
    const res = await call('/api/khong-ton-tai');
    assert.equal(res.status, 404);
    const body: any = await res.json();
    assert.equal(body.error, 'API endpoint not found');
    assert.equal(body.path, '/api/khong-ton-tai');
  });

  await t.test('Đăng ký traveler trả 201 kèm token', async () => {
    const res = await call('/api/auth/register', jsonInit('POST', { email, password, fullName: 'Khách Hợp Đồng', role: 'traveler' }));
    assert.equal(res.status, 201);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.role, 'traveler');
    assert.ok(body.token);
    token = body.token;
  });

  await t.test('Tự đăng ký admin bị từ chối 403', async () => {
    const res = await call('/api/auth/register', jsonInit('POST', { email: `admin.${email}`, password, fullName: 'X', role: 'admin' }));
    assert.equal(res.status, 403);
  });

  await t.test('Turnstile token lỗi (2x…AA) bị từ chối 400', async () => {
    const res = await call('/api/auth/login', jsonInit('POST', { identifier: email, password, turnstileToken: '2x0000000000000000000000000000000AA' }));
    assert.equal(res.status, 400);
    const body: any = await res.json();
    assert.match(body.error, /TURNSTILE/);
  });

  await t.test('Đăng nhập sai mật khẩu 401, đúng mật khẩu 200', async () => {
    const bad = await call('/api/auth/login', jsonInit('POST', { identifier: email, password: 'sai-mat-khau' }));
    assert.equal(bad.status, 401);
    const good = await call('/api/auth/login', jsonInit('POST', { identifier: email, password }));
    assert.equal(good.status, 200);
    const body: any = await good.json();
    assert.ok(body.token);
  });

  await t.test('/api/auth/me: thiếu token 401, có token 200', async () => {
    assert.equal((await call('/api/auth/me')).status, 401);
    const res = await call('/api/auth/me', authInit(token));
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.user.email, email);
  });

  await t.test('Booking của tôi: danh sách rỗng 200; mã không tồn tại 404', async () => {
    const list = await call('/api/user/bookings', authInit(token));
    assert.equal(list.status, 200);
    assert.deepEqual(((await list.json()) as any).data, []);
    const one = await call('/api/user/bookings/khong-ton-tai', authInit(token));
    assert.equal(one.status, 404);
  });

  await t.test('Traveler không vào được route đối tác/quản trị/gateway (403)', async () => {
    assert.equal((await call('/api/partner/listings', authInit(token))).status, 403);
    assert.equal((await call('/api/partner/listings/homestay-may', jsonInit('PUT', {}, token))).status, 403);
    assert.equal((await call('/api/admin/overview', authInit(token))).status, 403);
    assert.equal((await call('/api/revid/test-connection', jsonInit('POST', {}, token))).status, 403);
    assert.equal((await call('/api/revid/playground-chat', jsonInit('POST', { prompt: 'x' }, token))).status, 403);
  });

  await t.test('POST /api/revid/classify trả mức độ tác vụ', async () => {
    const res = await call('/api/revid/classify', jsonInit('POST', { prompt: 'Lên lịch trình 3 ngày 2 đêm săn mây Tà Xùa' }));
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.data.level, 'L3_reasoning');
  });

  await t.test('POST /api/ai/quick-quote và /api/ai/consult trả báo giá (bộ quy tắc nội bộ)', async () => {
    const trip = { checkIn: '2026-11-20', checkOut: '2026-11-22', guests: 2, budget: 2500000, pickupLocation: 'Hà Nội' };
    const quick = await call('/api/ai/quick-quote', jsonInit('POST', trip));
    assert.equal(quick.status, 200);
    assert.equal(((await quick.json()) as any).data.stayDurationNights, 2);
    const consult = await call('/api/ai/consult', jsonInit('POST', trip));
    assert.equal(consult.status, 200);
    const body: any = await consult.json();
    assert.equal(body.success, true);
    assert.ok(body.data.summary);
  });

  await t.test('Đổi mật khẩu: sai mật khẩu cũ 400, đúng thì đăng nhập bằng mật khẩu mới được', async () => {
    const wrong = await call('/api/auth/change-password', jsonInit('POST', { currentPassword: 'sai', newPassword: 'MatKhauMoi456!' }, token));
    assert.equal(wrong.status, 400);
    const ok = await call('/api/auth/change-password', jsonInit('POST', { currentPassword: password, newPassword: 'MatKhauMoi456!' }, token));
    assert.equal(ok.status, 200);
    const relogin = await call('/api/auth/login', jsonInit('POST', { identifier: email, password: 'MatKhauMoi456!' }));
    assert.equal(relogin.status, 200);
    token = ((await relogin.json()) as any).token;
  });

  await t.test('Đăng xuất thu hồi phiên', async () => {
    assert.equal((await call('/api/auth/logout', jsonInit('POST', {}, token))).status, 200);
    assert.equal((await call('/api/auth/me', authInit(token))).status, 401);
  });
}

test('Hợp đồng API trên Express', { timeout: 120_000 }, async (t) => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.REVID_API_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  const app = await createExpressApp({ isProd: true, skipVite: true, db });
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await runContract(t, (route, init) => fetch(base + route, init), 'express');
  } finally {
    server.close();
  }
});

test('Hợp đồng API trên Worker (workerd)', { timeout: 180_000 }, async (t) => {
  const persistTo = fs.mkdtempSync(path.join(os.tmpdir(), 'taxua-contract-'));
  // D1 local mới tinh chưa có bảng: áp migration chuẩn giống cách làm với D1 production.
  execSync(
    `npx wrangler d1 execute taxua-trip-db --local --persist-to "${persistTo}" --file migrations_d1/0001_initial_schema.sql`,
    { cwd: projectRoot, stdio: 'ignore' }
  );
  const worker = await unstable_dev(path.join(projectRoot, 'src/worker.ts'), {
    config: path.join(projectRoot, 'wrangler.toml'),
    local: true,
    persistTo,
    vars: { NODE_ENV: 'development' },
    logLevel: 'error',
    experimental: { disableExperimentalWarning: true }
  });
  try {
    await runContract(t, (route, init) => worker.fetch(route, init as any) as unknown as Promise<Response>, 'worker');
  } finally {
    await worker.stop();
    fs.rmSync(persistTo, { recursive: true, force: true });
  }
});
