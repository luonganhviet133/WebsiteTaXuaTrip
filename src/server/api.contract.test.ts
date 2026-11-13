/**
 * G0.4 — Hợp đồng API: cùng một bộ kiểm tra chạy trên Express (Node, dùng khi dev)
 * và trên Worker (workerd, chính là bản deploy lên Cloudflare). Hai bên phải trả giống nhau.
 *
 * Không gọi dịch vụ trả phí: không có GEMINI_API_KEY/REVID_API_KEY nên AI chạy bộ quy tắc nội bộ;
 * không gọi /api/revid/test-connection bằng quyền admin (route này gọi mạng ra ngoài).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { unstable_dev } from 'wrangler';
import { createExpressApp } from '../../server.ts';
import { DatabaseEngine } from './db.ts';
import { addDays, todayInVietnam } from '../search/searchIntent.ts';

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

  await t.test('Danh bạ công khai: 172 cơ sở đã nhập, đều Cấp 1, không tọa độ giả', async () => {
    const res = await call('/api/listings');
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.data.length, 172);
    assert.ok(body.data.every((l: any) => l.verificationTier === 1 && l.coordinates === null && l.rating === 0));
    const one = await call(`/api/listings/${body.data[0].id}`);
    assert.equal(one.status, 200);
    assert.equal((await call('/api/listings/homestay-may')).status, 404, 'cơ sở tự bịa không có trong dữ liệu thật');
  });

  await t.test('Báo giá: cơ sở chưa có hạng phòng → 409 NOT_QUOTABLE; ngày lễ đọc được', async () => {
    const q = await call('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: 'tx-stay-5', roomTypeId: 'x', checkIn: '2099-01-05', checkOut: '2099-01-06', adults: 2 }),
    });
    assert.equal(q.status, 409);
    assert.equal(((await q.json()) as any).code, 'NOT_QUOTABLE');
    const h = await call('/api/pricing/holidays');
    assert.equal(h.status, 200);
    assert.deepEqual(((await h.json()) as any).data, []);
  });

  await t.test('Tồn phòng: bảng tồn tìm kiếm trả 200 (chưa cơ sở nào có hạng phòng); chi tiết cơ sở trả danh sách rỗng', async () => {
    const all = await call('/api/availability?checkIn=2099-01-05&checkOut=2099-01-07');
    assert.equal(all.status, 200);
    assert.deepEqual(((await all.json()) as any).data, {});
    const one = await call('/api/listings/tx-stay-5/availability?checkIn=2099-01-05&checkOut=2099-01-07');
    assert.equal(one.status, 200);
    assert.deepEqual(((await one.json()) as any).data.rooms, []);
    assert.equal((await call('/api/availability?checkIn=2099-01-07&checkOut=2099-01-05')).status, 400);
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
  // D1 local mới tinh chưa có bảng: áp migration bằng đúng lệnh `npm run deploy` dùng cho D1 thật.
  execSync(`npx wrangler d1 migrations apply DB --local --persist-to "${persistTo}"`, {
    cwd: projectRoot,
    stdio: 'ignore'
  });
  const worker = await unstable_dev(path.join(projectRoot, 'src/worker.ts'), {
    config: path.join(projectRoot, 'wrangler.toml'),
    local: true,
    persistTo,
    vars: { NODE_ENV: 'development' },
    logLevel: 'error',
    experimental: { disableExperimentalWarning: true }
  });
  let holdWorker: Awaited<ReturnType<typeof unstable_dev>> | undefined;
  try {
    await runContract(t, (route, init) => worker.fetch(route, init as any) as unknown as Promise<Response>, 'worker');
    // N05.3: một tài khoản sẽ được nâng làm admin (vai trò đọc lại từ hồ sơ mỗi yêu cầu, token vẫn dùng được).
    const opsEmail = `ops.${Date.now()}@example.com`;
    const opsReg = await worker.fetch('/api/auth/register', jsonInit('POST', { email: opsEmail, password: 'MatKhau123!', fullName: 'Vận Hành', role: 'traveler' }) as any);
    assert.equal(opsReg.status, 201);
    const opsToken = ((await opsReg.json()) as any).token as string;
    await worker.stop();

    // N05.2 — giữ chỗ trên D1 thật (workerd): migration 0006 dựng lại bảng bookings, batch rollback nhờ CHECK,
    // changes() trong UPDATE có điều kiện. Cho tx-stay-5 một hạng phòng chỉ còn 1 phòng rồi khởi động lại Worker.
    const roomTypes = JSON.stringify([{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms: 1, availableRooms: 1, amenities: [], viewType: 'Sân vườn' }]);
    execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', persistTo, '--command',
        `UPDATE listing_versions SET content_json = json_set(content_json, '$.roomTypes', json('${roomTypes}')) WHERE listing_id = 'tx-stay-5'; UPDATE profiles SET role = 'admin' WHERE email = '${opsEmail}'`],
      { cwd: projectRoot, stdio: 'ignore' }
    );
    holdWorker = await unstable_dev(path.join(projectRoot, 'src/worker.ts'), {
      config: path.join(projectRoot, 'wrangler.toml'),
      local: true,
      persistTo,
      vars: { NODE_ENV: 'development' },
      logLevel: 'error',
      experimental: { disableExperimentalWarning: true }
    });
    const call: Fetcher = (route, init) => holdWorker!.fetch(route, init as any) as unknown as Promise<Response>;
    await t.test('N05.2–N05.3 trên D1 thật: 20 yêu cầu đồng thời chỉ 1 đơn thắng; hủy trả phòng; xác nhận, quét QR đồng thời, hoàn tất', async () => {
      const reg = await call('/api/auth/register', jsonInit('POST', { email: `hold.${Date.now()}@example.com`, password: 'MatKhau123!', fullName: 'Khách Giữ Chỗ', role: 'traveler' }));
      assert.equal(reg.status, 201);
      const token = ((await reg.json()) as any).token;
      let checkIn = addDays(todayInVietnam(), 7);
      while (new Date(`${checkIn}T00:00:00Z`).getUTCDay() !== 1) checkIn = addDays(checkIn, 1);
      const checkOut = addDays(checkIn, 2);
      const q = await call('/api/quotes', jsonInit('POST', { listingId: 'tx-stay-5', roomTypeId: 'r1', checkIn, checkOut, adults: 2, children: 0, rooms: 1 }));
      assert.equal(q.status, 200);
      const quoteId = ((await q.json()) as any).data.id;

      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          call('/api/bookings/holds', jsonInit('POST', { quoteId, idempotencyKey: `race-${i}`, guestName: 'Khách Giữ Chỗ', guestPhone: '0912345678' }, token))
            .then(async (r) => ({ status: r.status, body: (await r.json()) as any }))
        )
      );
      const won = results.filter((r) => r.status === 201);
      assert.equal(won.length, 1, JSON.stringify(results.map((r) => r.status)));
      assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409 && r.body.code === 'SOLD_OUT'));
      const booking = won[0].body.data;
      assert.equal(booking.totalAmount, 1000000);
      assert.equal(booking.depositAmount, 300000);

      const soldOut: any = await (await call(`/api/listings/tx-stay-5/availability?checkIn=${checkIn}&checkOut=${checkOut}`)).json();
      assert.equal(soldOut.data.rooms[0].available, 0);

      const cancel = await call(`/api/bookings/${booking.id}/cancel`, jsonInit('POST', { reason: 'Thử hủy' }, token));
      assert.equal(cancel.status, 200);
      const again = await call(`/api/bookings/${booking.id}/cancel`, jsonInit('POST', {}, token));
      assert.equal(again.status, 200);
      assert.equal(((await again.json()) as any).already, true, 'hủy lần hai không tác động lặp');
      const freed: any = await (await call(`/api/listings/tx-stay-5/availability?checkIn=${checkIn}&checkOut=${checkOut}`)).json();
      assert.equal(freed.data.rooms[0].available, 1);

      // N05.3 trên D1 thật: xác nhận → mã QR (chỉ mục duy nhất có điều kiện) → 5 lần quét cùng lúc chỉ nhận phòng một lần.
      // Khách thứ hai: khách đầu đã dùng hết 20 lần giữ chỗ/phút trong ca tranh phòng.
      const reg2 = await call('/api/auth/register', jsonInit('POST', { email: `hold2.${Date.now()}@example.com`, password: 'MatKhau123!', fullName: 'Khách Hai', role: 'traveler' }));
      assert.equal(reg2.status, 201);
      const token2 = ((await reg2.json()) as any).token as string;
      const today = todayInVietnam();
      const q2 = await call('/api/quotes', jsonInit('POST', { listingId: 'tx-stay-5', roomTypeId: 'r1', checkIn: today, checkOut: addDays(today, 1), adults: 2, children: 0, rooms: 1 }));
      assert.equal(q2.status, 200);
      const h2 = await call('/api/bookings/holds', jsonInit('POST', { quoteId: ((await q2.json()) as any).data.id, idempotencyKey: 'today-1', guestName: 'Khách Giữ Chỗ', guestPhone: '0912345678' }, token2));
      assert.equal(h2.status, 201);
      const b2 = ((await h2.json()) as any).data;
      assert.equal((await call(`/api/bookings/${b2.id}/confirm`, jsonInit('POST', {}, token2))).status, 403, 'khách không tự xác nhận');
      const conf = await call(`/api/bookings/${b2.id}/confirm`, jsonInit('POST', {}, opsToken));
      assert.equal(conf.status, 200);
      const qr = ((await (await call(`/api/bookings/${b2.id}`, authInit(token2))).json()) as any).data.checkinToken;
      assert.match(qr, /^[A-Za-z0-9_-]{43}$/);
      const scans = await Promise.all(
        Array.from({ length: 5 }, () => call('/api/partner/checkin', jsonInit('POST', { token: qr }, opsToken)).then(async (r) => ({ status: r.status, body: (await r.json()) as any })))
      );
      assert.ok(scans.every((r) => r.status === 200), JSON.stringify(scans.map((r) => r.status)));
      assert.equal(scans.filter((r) => r.body.already === false).length, 1, 'đúng một lần nhận phòng');
      const hist = ((await (await call(`/api/bookings/${b2.id}`, authInit(token2))).json()) as any).data.events.map((e: any) => e.action);
      assert.deepEqual(hist, ['hold', 'confirm', 'check_in']);
      const done = await call(`/api/bookings/${b2.id}/complete`, jsonInit('POST', {}, opsToken));
      assert.equal(done.status, 200);
      assert.equal(((await done.json()) as any).data.status, 'completed');
    });
  } finally {
    await worker.stop().catch(() => undefined);
    await holdWorker?.stop();
    fs.rmSync(persistTo, { recursive: true, force: true });
  }
});
