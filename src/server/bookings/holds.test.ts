import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { HoldStore, HOLD_TTL_MS, depositFor } from './holds.ts';
import { InventoryStore } from '../inventory/store.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';

const mon = (() => {
  let d = addDays(todayInVietnam(), 1);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
})();
const tue = addDays(mon, 1);
const wed = addDays(mon, 2);

const rooms = (totalRooms: number) => ({
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms, availableRooms: totalRooms, amenities: [], viewType: 'Sân vườn' }],
});

async function setup(totalRooms = 1) {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = { db, clientIp: '10.0.0.3', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  const tokenOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    return (await db.createSession(p!.id, p!.role)).token;
  };
  const t = {
    admin: await tokenOf('admin@taxuatrip.vn'),
    a: await tokenOf('traveler.a@gmail.com'),
    b: await tokenOf('traveler.b@gmail.com'),
  };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: rooms(totalRooms) })).status, 200);
  const quote = async (over: Record<string, unknown> = {}) => {
    const q = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn: mon, checkOut: wed, adults: 2, rooms: 1, ...over });
    assert.equal(q.status, 200, JSON.stringify(q.body));
    return q.body.data;
  };
  const hold = (token: string | undefined, quoteId: string, key: string, over: Record<string, unknown> = {}) =>
    call('POST', '/api/bookings/holds', token, { quoteId, idempotencyKey: key, guestName: 'Khách Thử', guestPhone: '0981234567', ...over });
  const available = async (checkIn = mon, checkOut = wed, now = new Date()) =>
    (await new InventoryStore(db.d1).forListing('homestay-may', rooms(totalRooms).roomTypes as any, checkIn, checkOut, now))[0].available;
  const allocCount = async () => (await db.d1.prepare('SELECT COUNT(*) AS n FROM room_night_allocations').first<{ n: number }>())!.n;
  return { db, call, t, quote, hold, available, allocCount };
}

test('N05.2: 20 yêu cầu tranh phòng cuối chỉ một yêu cầu giữ được', async () => {
  const { quote, hold, t, available, allocCount, db } = await setup(1);
  const q = await quote();
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => hold(i % 2 ? t.a : t.b, q.id, `key-${i}`)));
  const ok = results.filter((r) => r.status === 201);
  assert.equal(ok.length, 1, results.map((r) => r.status).join(','));
  assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409 && r.body.code === 'SOLD_OUT'));
  assert.equal(await available(), 0);
  assert.equal(await allocCount(), 2, 'đúng 2 đêm của 1 đơn');
  const n = await db.d1.prepare("SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending_deposit'").first<{ n: number }>();
  assert.equal(n!.n, 1);
});

test('N05.2: giữ đủ mọi đêm hoặc không đêm nào', async () => {
  const { quote, hold, t, call, allocCount } = await setup(1);
  const q = await quote();
  // Đêm thứ Ba bị chủ khóa sau khi khách đã lấy báo giá
  const p = await call('PUT', '/api/partner/listings/homestay-may/inventory', t.admin, { roomTypeId: 'r1', dates: [tue], availableRooms: 0 });
  assert.equal(p.status, 200);
  const r = await hold(t.a, q.id, 'k1');
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'SOLD_OUT');
  assert.equal(await allocCount(), 0, 'không giữ lẻ đêm thứ Hai');
});

test('N05.2: gửi lại cùng khóa không tạo thêm đơn; cùng khóa khác nội dung bị từ chối', async () => {
  const { quote, hold, t, db, allocCount } = await setup(2);
  const q = await quote();
  const first = await hold(t.a, q.id, 'retry-1');
  assert.equal(first.status, 201);
  const again = await hold(t.a, q.id, 'retry-1');
  assert.equal(again.status, 200);
  assert.equal(again.body.data.id, first.body.data.id);
  assert.equal(await allocCount(), 2);
  const n = await db.d1.prepare('SELECT COUNT(*) AS n FROM bookings').first<{ n: number }>();
  const before = n!.n;
  const mismatch = await hold(t.a, q.id, 'retry-1', { guestName: 'Người Khác' });
  assert.equal(mismatch.status, 422);
  assert.equal(mismatch.body.code, 'IDEMPOTENCY_MISMATCH');
  assert.equal((await db.d1.prepare('SELECT COUNT(*) AS n FROM bookings').first<{ n: number }>())!.n, before);
  const otherUser = await hold(t.b, q.id, 'retry-1');
  assert.equal(otherUser.status, 201, 'khóa là theo từng người dùng');
});

test('N05.2: đơn giữ chỗ có mã ngẫu nhiên, tổng lấy từ báo giá server, cọc 30% làm tròn lên', async () => {
  const { quote, hold, t } = await setup(1);
  const q = await quote();
  const r = await hold(t.a, q.id, 'k-money', { totalAmount: 1, depositAmount: 1 });
  assert.equal(r.status, 201);
  const b = r.body.data;
  assert.match(b.id, /^bk_[a-z0-9]{20}$/);
  assert.match(b.bookingCode, /^TX[A-Z2-9]{8}$/);
  assert.equal(b.status, 'pending_deposit');
  assert.equal(b.totalAmount, q.total);
  assert.equal(b.depositAmount, depositFor(q.total));
  assert.equal(depositFor(1_300_000), 390_000);
  assert.equal(depositFor(1_000_001), 300_001, 'làm tròn lên tới đồng');
  assert.equal(b.rooms, 1);
  assert.equal(b.roomTypeId, 'r1');
  const expiresIn = Date.parse(b.holdExpiresAt) - Date.now();
  assert.ok(expiresIn > HOLD_TTL_MS - 60_000 && expiresIn <= HOLD_TTL_MS, 'hạn 30 phút');
});

test('N05.2: chưa đăng nhập, báo giá hết hạn, hồ sơ đổi phiên bản đều bị chặn', async () => {
  const { quote, hold, t, call, db } = await setup(2);
  const q = await quote();
  assert.equal((await hold(undefined, q.id, 'k')).status, 401);
  assert.equal((await hold(t.a, 'q_khongco', 'k')).body.code, 'QUOTE_NOT_FOUND');
  assert.equal((await hold(t.a, q.id, 'k', { guestPhone: '123' })).status, 400);
  await db.d1.prepare("UPDATE quotes SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").bind(q.id).run();
  const expired = await hold(t.a, q.id, 'k2');
  assert.equal(expired.status, 409);
  assert.equal(expired.body.code, 'QUOTE_EXPIRED');
  const q2 = await quote();
  await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: { ...rooms(2), title: 'Đổi tên' } });
  const changed = await hold(t.a, q2.id, 'k3');
  assert.equal(changed.status, 409);
  assert.equal(changed.body.code, 'LISTING_CHANGED');
});

test('N05.2: giữ chỗ hết hạn trả phòng, không xác nhận được bằng yêu cầu cũ (đồng hồ kiểm soát)', async () => {
  const { quote, hold, t, db, available } = await setup(1);
  const q = await quote();
  const r = await hold(t.a, q.id, 'k-exp');
  assert.equal(r.status, 201);
  const holds = new HoldStore(db.d1);
  const created = Date.parse(r.body.data.createdAt);
  const before = new Date(created + HOLD_TTL_MS - 1000);
  const after = new Date(created + HOLD_TTL_MS + 1000);
  assert.equal(await available(mon, wed, before), 0);
  assert.equal(await available(mon, wed, after), 1, 'quá hạn thì tự trả phòng, không cần tác vụ dọn');

  const lateConfirm = await holds.confirmHold(r.body.data.id, { id: 'admin', role: 'admin' }, after);
  assert.equal(lateConfirm.ok, false);
  if (!lateConfirm.ok) assert.equal(lateConfirm.code, 'HOLD_EXPIRED');

  const swept = await holds.expireHolds(after);
  assert.equal(swept.expired, 1);
  const row = await db.d1.prepare('SELECT status FROM bookings WHERE id = ?').bind(r.body.data.id).first<{ status: string }>();
  assert.equal(row!.status, 'expired');
  assert.equal((await holds.expireHolds(after)).expired, 0, 'chạy lại không tác động lặp');
  const stillExpired = await holds.confirmHold(r.body.data.id, { id: 'admin', role: 'admin' }, before);
  assert.equal(stillExpired.ok, false, 'đơn đã hết hạn không xác nhận lại được kể cả bằng đồng hồ cũ');
});

test('N05.2: xác nhận khi còn hạn giữ phòng vĩnh viễn; chạy lại không tác động lặp', async () => {
  const { quote, hold, t, db, available } = await setup(1);
  const q = await quote();
  const r = await hold(t.a, q.id, 'k-conf');
  const holds = new HoldStore(db.d1);
  const ok = await holds.confirmHold(r.body.data.id, { id: 'admin', role: 'admin' });
  assert.equal(ok.ok, true);
  const again = await holds.confirmHold(r.body.data.id, { id: 'admin', role: 'admin' });
  assert.equal(again.ok, false);
  const far = new Date(Date.now() + 10 * HOLD_TTL_MS);
  assert.equal(await available(mon, wed, far), 0, 'đã xác nhận thì không hết hạn');
  assert.equal((await holds.expireHolds(far)).expired, 0);
});

test('N05.2: khách hủy giữ chỗ thì trả phòng; người khác không hủy được', async () => {
  const { quote, hold, t, call, available } = await setup(1);
  const q = await quote();
  const r = await hold(t.a, q.id, 'k-cancel');
  const id = r.body.data.id;
  assert.equal((await call('POST', `/api/bookings/${id}/cancel`, t.b)).status, 403);
  assert.equal((await call('POST', `/api/bookings/${id}/cancel`)).status, 401);
  const c = await call('POST', `/api/bookings/${id}/cancel`, t.a, { reason: 'Đổi kế hoạch' });
  assert.equal(c.status, 200);
  assert.equal(c.body.data.status, 'cancelled');
  assert.equal(await available(), 1);
  const again = await call('POST', `/api/bookings/${id}/cancel`, t.a);
  assert.equal(again.status, 409, 'hủy lần hai không tác động lặp');
  const q2 = await quote();
  assert.equal((await hold(t.b, q2.id, 'k-after')).status, 201, 'phòng đã trả cho người khác giữ');
});

test('N05.2: voucher giới hạn 1 lượt — hai đơn cùng lúc chỉ một đơn dùng được; giữ chỗ hết hạn trả lượt', async () => {
  const { quote, hold, t, call, db } = await setup(3);
  await call('POST', '/api/admin/vouchers', t.admin, {
    code: 'MOTLUOT', title: '1 lượt', discountType: 'fixed', discountValue: 50000, minBookingAmount: 0, applicableCategory: 'all', isActive: true, usageLimit: 1,
  });
  const qa = await quote({ voucherCode: 'MOTLUOT' });
  const qb = await quote({ voucherCode: 'MOTLUOT' });
  assert.equal(qa.discount, 50000);
  const [ra, rb] = await Promise.all([hold(t.a, qa.id, 'va'), hold(t.b, qb.id, 'vb')]);
  const statuses = [ra.status, rb.status].sort();
  assert.deepEqual(statuses, [201, 409]);
  const loser = ra.status === 409 ? ra : rb;
  assert.equal(loser.body.code, 'VOUCHER_USED_UP');
  const q3 = await quote({ voucherCode: 'MOTLUOT' });
  assert.equal(q3.voucherError?.code, 'VOUCHER_USED_UP', 'báo giá mới thấy hết lượt');
  const winner = ra.status === 201 ? ra : rb;
  await db.d1.prepare("UPDATE bookings SET hold_expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").bind(winner.body.data.id).run();
  await db.d1.prepare("UPDATE room_night_allocations SET expires_at = '2000-01-01T00:00:00.000Z' WHERE source_id = ?").bind(winner.body.data.id).run();
  const q4 = await quote({ voucherCode: 'MOTLUOT' });
  assert.equal(q4.discount, 50000, 'giữ chỗ hết hạn thì trả lượt voucher');
});

test('N05.2: Cron của Worker (scheduled) chuyển giữ chỗ quá hạn sang expired và nhả phòng', async () => {
  const { quote, hold, t, db } = await setup(1);
  const r = await hold(t.a, (await quote()).id, 'cron-1');
  assert.equal(r.status, 201);
  const past = new Date(Date.now() - 60_000).toISOString();
  await db.d1.prepare('UPDATE bookings SET hold_expires_at = ? WHERE id = ?').bind(past, r.body.data.id).run();
  await db.d1.prepare('UPDATE room_night_allocations SET expires_at = ? WHERE source_id = ?').bind(past, r.body.data.id).run();

  const worker = (await import('../../worker.ts')).default;
  await worker.scheduled(undefined, { DB: db.d1 } as any);

  const b = await db.d1.prepare('SELECT status FROM bookings WHERE id = ?').bind(r.body.data.id).first<{ status: string }>();
  assert.equal(b!.status, 'expired');
  const held = await db.d1.prepare("SELECT COUNT(*) AS n FROM room_night_allocations WHERE source_id = ? AND status = 'held'").bind(r.body.data.id).first<{ n: number }>();
  assert.equal(held!.n, 0);
});
