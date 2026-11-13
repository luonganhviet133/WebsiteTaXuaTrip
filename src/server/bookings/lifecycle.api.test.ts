import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { BookingLifecycle } from './store.ts';
import { InventoryStore } from '../inventory/store.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';

// Thứ Hai sắp tới (giá ngày thường), cách hôm nay ít nhất 1 ngày
const mon = (() => {
  let d = addDays(todayInVietnam(), 2);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
})();
const wed = addDays(mon, 2);
/** Một thời điểm (UTC) rơi vào ngày `date` theo giờ Việt Nam, 10:00 sáng. */
const atVn = (date: string) => new Date(`${date}T03:00:00Z`);

const rooms = (totalRooms: number) => ({
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms, availableRooms: totalRooms, amenities: [], viewType: 'Sân vườn' }],
});

async function setup(totalRooms = 2) {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures(); // partner A sở hữu homestay-may, partner B sở hữu homestay-lutre
  const ctx: ApiContext = { db, clientIp: '10.0.0.4', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  const tokenOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    return (await db.createSession(p!.id, p!.role)).token;
  };
  const t = {
    admin: await tokenOf('admin@taxuatrip.vn'),
    ownerA: await tokenOf('partner.a@taxuatrip.vn'),
    ownerB: await tokenOf('partner.b@taxuatrip.vn'),
    guest: await tokenOf('traveler.a@gmail.com'),
    guest2: await tokenOf('traveler.a@gmail.com'), // thiết bị thứ hai của cùng khách
    other: await tokenOf('traveler.b@gmail.com'),
  };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: rooms(totalRooms) })).status, 200);
  let n = 0;
  const hold = async (checkIn = mon, checkOut = wed, token = t.guest) => {
    const q = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn, checkOut, adults: 2, rooms: 1 });
    assert.equal(q.status, 200, JSON.stringify(q.body));
    const h = await call('POST', '/api/bookings/holds', token, { quoteId: q.body.data.id, idempotencyKey: `k${++n}`, guestName: 'Khách Thử', guestPhone: '0981234567' });
    assert.equal(h.status, 201, JSON.stringify(h.body));
    return h.body.data;
  };
  const available = async (checkIn = mon, checkOut = wed) =>
    (await new InventoryStore(db.d1).forListing('homestay-may', rooms(totalRooms).roomTypes as any, checkIn, checkOut, new Date()))[0].available;
  const events = async (id: string) =>
    (await db.d1.prepare('SELECT action, from_status, to_status, actor_role FROM booking_events WHERE booking_id = ? ORDER BY created_at, rowid').bind(id).all<any>()).results;
  const lifecycle = new BookingLifecycle(db.d1);
  const actorOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    const provider = await db.d1.prepare('SELECT id FROM providers WHERE user_id = ?').bind(p!.id).first<{ id: string }>();
    return { id: p!.id, role: p!.role as any, providerId: provider?.id ?? null };
  };
  return { db, call, t, hold, available, events, lifecycle, actorOf };
}

test('N05.3: chủ cơ sở xác nhận đã nhận cọc; người khác không làm được; bấm lại không ghi thêm', async () => {
  const { call, t, hold, events, db } = await setup();
  const b = await hold();

  assert.equal((await call('POST', `/api/bookings/${b.id}/confirm`, t.guest)).status, 403, 'khách không tự xác nhận');
  assert.equal((await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerB)).status, 403, 'chủ cơ sở khác');
  assert.equal((await call('POST', `/api/bookings/${b.id}/confirm`)).status, 401);

  const ok = await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.status, 'confirmed');
  assert.equal(ok.body.already, false);
  const alloc = await db.d1.prepare("SELECT COUNT(*) AS n FROM room_night_allocations WHERE source_id = ? AND status = 'confirmed' AND expires_at IS NULL").bind(b.id).first<{ n: number }>();
  assert.equal(alloc!.n, 2, 'hai đêm chuyển sang đã xác nhận, không còn hạn');

  const again = await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  assert.equal(again.status, 200);
  assert.equal(again.body.already, true);
  assert.deepEqual((await events(b.id)).map((e: any) => `${e.action}:${e.from_status}>${e.to_status}:${e.actor_role}`), [
    'hold:null>pending_deposit:traveler',
    'confirm:pending_deposit>confirmed:partner',
  ]);
});

test('N05.3: mã QR chỉ khách chủ đơn thấy, chỉ khi đơn đã xác nhận', async () => {
  const { call, t, hold } = await setup();
  const b = await hold();
  const before = await call('GET', `/api/bookings/${b.id}`, t.guest);
  assert.equal(before.status, 200);
  assert.equal(before.body.data.checkinToken, null, 'chưa xác nhận thì chưa có mã');
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);

  const g = await call('GET', `/api/bookings/${b.id}`, t.guest);
  assert.match(g.body.data.checkinToken, /^[A-Za-z0-9_-]{43}$/, '256 bit base64url');
  assert.equal(g.body.data.events.length, 2);
  const o = await call('GET', `/api/bookings/${b.id}`, t.ownerA);
  assert.equal(o.status, 200);
  assert.equal(o.body.data.checkinToken, null, 'chủ cơ sở không thấy mã của khách');
  assert.equal((await call('GET', `/api/bookings/${b.id}`, t.ownerB)).status, 403);
  assert.equal((await call('GET', `/api/bookings/${b.id}`, t.other)).status, 403);
});

test('N05.3: từ chối phải có lý do, trả phòng ngay', async () => {
  const { call, t, hold, available } = await setup(1);
  const b = await hold();
  assert.equal(await available(), 0);
  assert.equal((await call('POST', `/api/bookings/${b.id}/reject`, t.ownerA, {})).status, 400);
  const r = await call('POST', `/api/bookings/${b.id}/reject`, t.ownerA, { reason: 'Phòng đang sửa' });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.status, 'cancelled');
  assert.equal(await available(), 1);
  assert.equal((await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA)).status, 409, 'đơn đã hủy không xác nhận lại được');
});

test('N05.3: khách hủy đơn đã xác nhận trước ngày nhận phòng; chủ cơ sở chưa tự hủy đơn đã xác nhận', async () => {
  const { call, t, hold, available } = await setup(1);
  const b = await hold();
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  assert.equal((await call('POST', `/api/bookings/${b.id}/cancel`, t.ownerA, { reason: 'x' })).status, 403);
  assert.equal((await call('POST', `/api/bookings/${b.id}/cancel`, t.other)).status, 403);
  const c = await call('POST', `/api/bookings/${b.id}/cancel`, t.guest, { reason: 'Đổi kế hoạch' });
  assert.equal(c.status, 200, JSON.stringify(c.body));
  assert.equal(c.body.data.status, 'cancelled');
  assert.equal(await available(), 1, 'trả phòng');
  assert.equal((await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA)).status, 409, 'đã hủy không thành hoàn tất');
});

test('N05.3: nhận phòng bằng QR — sai mã, trái cơ sở, chưa tới ngày, hết hạn đều bị chặn', async () => {
  const { call, t, hold, lifecycle, actorOf } = await setup();
  const b = await hold();
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  const token = (await call('GET', `/api/bookings/${b.id}`, t.guest)).body.data.checkinToken;

  const bad = await call('POST', '/api/partner/checkin', t.ownerA, { token: 'x'.repeat(43) });
  assert.equal(bad.status, 404);
  assert.equal(bad.body.code, 'QR_INVALID');
  const wrong = await call('POST', '/api/partner/checkin', t.ownerB, { token });
  assert.equal(wrong.status, 403);
  assert.equal(wrong.body.code, 'QR_WRONG_LISTING');
  assert.equal((await call('POST', '/api/partner/checkin', t.guest, { token })).status, 403, 'khách không tự nhận phòng');
  const early = await call('POST', '/api/partner/checkin', t.ownerA, { token });
  assert.equal(early.status, 409);
  assert.equal(early.body.code, 'TOO_EARLY');

  const preview = await call('GET', `/api/partner/checkin?token=${token}`, t.ownerA);
  assert.equal(preview.status, 200);
  assert.equal(preview.body.data.bookingCode, b.bookingCode);
  assert.equal((await call('GET', `/api/partner/checkin?token=${token}`, t.ownerB)).status, 403);

  const owner = await actorOf('partner.a@taxuatrip.vn');
  const late = await lifecycle.checkInByToken(token, owner, atVn(wed));
  assert.equal(late.ok, false);
  assert.equal(!late.ok && late.code, 'QR_EXPIRED');
});

test('N05.3: quét QR nhiều lần, kể cả cùng lúc, chỉ nhận phòng một lần; rồi hoàn tất', async () => {
  const { call, t, hold, lifecycle, actorOf, events } = await setup();
  const b = await hold();
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  const token = (await call('GET', `/api/bookings/${b.id}`, t.guest)).body.data.checkinToken;
  const owner = await actorOf('partner.a@taxuatrip.vn');

  const results = await Promise.all(Array.from({ length: 5 }, () => lifecycle.checkInByToken(token, owner, atVn(mon))));
  assert.ok(results.every((r) => r.ok), JSON.stringify(results));
  assert.equal(results.filter((r) => r.ok && !r.already).length, 1, 'đúng một lần áp');
  assert.equal((await events(b.id)).filter((e: any) => e.action === 'check_in').length, 1, 'một dòng lịch sử');

  assert.equal((await call('POST', `/api/bookings/${b.id}/complete`, t.guest)).status, 403, 'khách không tự hoàn tất');
  const done = await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA);
  assert.equal(done.status, 200);
  assert.equal(done.body.data.status, 'completed');
  assert.equal((await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA)).body.already, true);
  assert.equal((await call('POST', `/api/bookings/${b.id}/cancel`, t.admin, { reason: 'x' })).status, 409, 'đã hoàn tất không hủy được');
});

test('N05.3: thao tác không có trong bảng bị từ chối (404), không ghi gì', async () => {
  const { call, t, hold, events } = await setup();
  const b = await hold();
  assert.equal((await call('POST', `/api/bookings/${b.id}/check_in`, t.ownerA)).status, 404, 'nhận phòng chỉ qua QR');
  assert.equal((await call('POST', `/api/bookings/${b.id}/hack`, t.admin)).status, 404);
  assert.equal((await call('POST', '/api/bookings/khong-co/confirm', t.admin)).status, 404);
  assert.equal((await events(b.id)).length, 1);
});

test('N05.3: chủ cơ sở thấy đơn của cơ sở mình trên server; thông báo chuông', async () => {
  const { call, t, hold } = await setup();
  const b = await hold();

  const listA = await call('GET', '/api/partner/bookings', t.ownerA);
  assert.equal(listA.status, 200);
  assert.ok(listA.body.data.some((x: any) => x.id === b.id));
  assert.ok(listA.body.data.every((x: any) => x.listingId === 'homestay-may'), 'chỉ đơn cơ sở mình');
  assert.ok(!(await call('GET', '/api/partner/bookings', t.ownerB)).body.data.some((x: any) => x.id === b.id));
  assert.equal((await call('GET', '/api/partner/bookings', t.guest)).status, 403);
  assert.ok((await call('GET', '/api/partner/bookings', t.admin)).body.data.some((x: any) => x.id === b.id));

  const na = await call('GET', '/api/notifications', t.ownerA);
  assert.equal(na.status, 200);
  assert.equal(na.body.data.unread, 1);
  assert.equal(na.body.data.items[0].kind, 'booking.hold');
  assert.equal(na.body.data.items[0].bookingId, b.id);
  assert.equal((await call('GET', '/api/notifications', t.ownerB)).body.data.unread, 0, 'chủ khác không nhận');

  await call('POST', `/api/bookings/${b.id}/cancel`, t.guest, { reason: 'Đổi lịch' });
  const after = await call('GET', '/api/notifications', t.ownerA);
  assert.equal(after.body.data.unread, 2);
  assert.equal(after.body.data.items[0].kind, 'booking.cancelled');

  assert.equal((await call('POST', '/api/notifications/read', t.ownerA, { all: true })).status, 200);
  assert.equal((await call('GET', '/api/notifications', t.ownerA)).body.data.unread, 0);
});

test('N05.3: hai thiết bị của cùng khách thấy cùng đơn và cùng trạng thái', async () => {
  const { call, t, hold } = await setup();
  const b = await hold();
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  const d1 = await call('GET', '/api/user/bookings', t.guest);
  const d2 = await call('GET', '/api/user/bookings', t.guest2);
  assert.equal(d1.status, 200);
  assert.deepEqual(d1.body.data, d2.body.data);
  const mine = d1.body.data.find((x: any) => x.id === b.id);
  assert.equal(mine.status, 'confirmed');
  assert.equal(mine.roomName, 'Phòng đôi');
  assert.ok(!(await call('GET', '/api/user/bookings', t.other)).body.data.some((x: any) => x.id === b.id));
});
