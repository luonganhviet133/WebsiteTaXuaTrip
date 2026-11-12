import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';

// Thứ Hai sắp tới (giá ngày thường), không phụ thuộc hôm chạy test
const mon = (() => {
  let d = addDays(todayInVietnam(), 1);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
})();
const tue = addDays(mon, 1);
const wed = addDays(mon, 2);

const roomContent = (totalRooms = 2) => ({
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms, availableRooms: totalRooms, amenities: [], viewType: 'Sân vườn' }],
});

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures(); // partner A sở hữu homestay-may (demo, đã duyệt), partner B sở hữu homestay-lutre
  const ctx: ApiContext = { db, clientIp: '10.0.0.2', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  const tokenOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    return (await db.createSession(p!.id, p!.role)).token;
  };
  const t = {
    admin: await tokenOf('admin@taxuatrip.vn'),
    a: await tokenOf('partner.a@taxuatrip.vn'),
    b: await tokenOf('partner.b@taxuatrip.vn'),
    traveler: await tokenOf('traveler.a@gmail.com'),
  };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: roomContent(2) })).status, 200);
  const alloc = async (id: string, date: string, quantity: number, status = 'confirmed', expiresAt: string | null = null) =>
    db.d1
      .prepare(`INSERT INTO room_night_allocations (id, listing_id, room_type_id, date, quantity, status, source_type, source_id, expires_at, created_at, updated_at) VALUES (?, 'homestay-may', 'r1', ?, ?, ?, 'test', ?, ?, ?, ?)`)
      .bind(`${id}-${date}`, date, quantity, status, id, expiresAt, new Date().toISOString(), new Date().toISOString())
      .run();
  return { db, call, t, alloc };
}

const avail = (call: any, checkIn = mon, checkOut = wed) => call('GET', `/api/listings/homestay-may/availability?checkIn=${checkIn}&checkOut=${checkOut}`);

test('N05.1 tồn phòng theo đêm qua API', async (tt) => {
  const { db, call, t, alloc } = await setup();

  await tt.test('Chưa có đơn: đủ 2 phòng mỗi đêm', async () => {
    const r = await avail(call);
    assert.equal(r.status, 200);
    assert.equal(r.body.data.rooms[0].roomTypeId, 'r1');
    assert.equal(r.body.data.rooms[0].available, 2);
    assert.deepEqual(r.body.data.rooms[0].nights.map((n: any) => n.date), [mon, tue]);
  });

  await tt.test('Một đơn đêm đầu + một đơn đêm sau → cả khoảng còn 1 phòng (không đếm thành hết)', async () => {
    await alloc('bk1', mon, 1);
    await alloc('bk2', tue, 1);
    const r = await avail(call);
    assert.equal(r.body.data.rooms[0].available, 1);
    assert.deepEqual(r.body.data.rooms[0].nights.map((n: any) => n.available), [1, 1]);
  });

  await tt.test('Giữ chỗ hết hạn và đơn đã nhả không giữ tồn; giữ chỗ còn hạn thì giữ', async () => {
    await alloc('hold-old', mon, 1, 'held', '2000-01-01T00:00:00Z');
    await alloc('rel', mon, 1, 'released');
    assert.equal((await avail(call)).body.data.rooms[0].available, 1);
    await alloc('hold-live', tue, 1, 'held', '2999-01-01T00:00:00Z');
    const r = await avail(call);
    assert.deepEqual(r.body.data.rooms[0].nights.map((n: any) => n.available), [1, 0]);
    assert.equal(r.body.data.rooms[0].available, 0, 'hết phòng là 0');
    await db.d1.prepare("UPDATE room_night_allocations SET status = 'released' WHERE source_id = 'hold-live'").run();
  });

  await tt.test('Báo giá dùng cùng nguồn tồn: xin 2 phòng khi chỉ còn 1 → NOT_ENOUGH_ROOMS', async () => {
    const q2 = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn: mon, checkOut: wed, adults: 4, rooms: 2 });
    assert.equal(q2.status, 400);
    assert.equal(q2.body.code, 'NOT_ENOUGH_ROOMS');
    const q1 = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn: mon, checkOut: wed, adults: 2, rooms: 1 });
    assert.equal(q1.status, 200);
  });

  await tt.test('Chủ cơ sở đặt "còn 0 phòng" cho đêm thứ Hai; không mở quá số đã đặt', async () => {
    const put = await call('PUT', '/api/partner/listings/homestay-may/inventory', t.a, { roomTypeId: 'r1', dates: [mon], availableRooms: 0 });
    assert.equal(put.status, 200);
    assert.deepEqual((await avail(call)).body.data.rooms[0].nights.map((n: any) => [n.closed, n.available]), [[1, 0], [0, 1]]);
    const over = await call('PUT', '/api/partner/listings/homestay-may/inventory', t.a, { roomTypeId: 'r1', dates: [mon], availableRooms: 2 });
    assert.equal(over.status, 409, 'đêm thứ Hai đã có 1 phòng được đặt nên tối đa còn 1');
    await call('PUT', '/api/partner/listings/homestay-may/inventory', t.a, { roomTypeId: 'r1', dates: [mon], availableRooms: 1 });
    assert.equal((await avail(call)).body.data.rooms[0].available, 1);
  });

  await tt.test('Quyền: chủ khác, khách, chưa đăng nhập không sửa được tồn', async () => {
    const body = { roomTypeId: 'r1', dates: [mon], availableRooms: 0 };
    assert.equal((await call('PUT', '/api/partner/listings/homestay-may/inventory', t.b, body)).status, 403);
    assert.equal((await call('PUT', '/api/partner/listings/homestay-may/inventory', t.traveler, body)).status, 403);
    assert.equal((await call('PUT', '/api/partner/listings/homestay-may/inventory', undefined, body)).status, 401);
    assert.equal((await call('PUT', '/api/partner/listings/homestay-may/inventory', t.admin, body)).status, 200, 'admin được sửa');
    await call('PUT', '/api/partner/listings/homestay-may/inventory', t.admin, { ...body, availableRooms: 1 });
  });

  await tt.test('Đầu vào sai bị chặn: hạng phòng lạ, ngày quá khứ, số âm, quá nhiều ngày', async () => {
    const bad = [
      { roomTypeId: 'khong-co', dates: [mon], availableRooms: 0 },
      { roomTypeId: 'r1', dates: ['2020-01-01'], availableRooms: 0 },
      { roomTypeId: 'r1', dates: [mon], availableRooms: -1 },
      { roomTypeId: 'r1', dates: [mon], availableRooms: 1.5 },
      { roomTypeId: 'r1', dates: Array.from({ length: 200 }, (_, i) => addDays(mon, i)), availableRooms: 0 },
    ];
    for (const b of bad) assert.equal((await call('PUT', '/api/partner/listings/homestay-may/inventory', t.a, b)).status, 400, JSON.stringify(b).slice(0, 80));
    assert.equal((await call('GET', `/api/listings/homestay-may/availability?checkIn=${wed}&checkOut=${mon}`)).status, 400);
  });

  await tt.test('Tìm kiếm: một lần gọi trả tồn của mọi cơ sở có hạng phòng', async () => {
    const r = await call('GET', `/api/availability?checkIn=${mon}&checkOut=${wed}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.data['homestay-may'].r1, 1);
    assert.equal(r.body.data['tx-stay-5'], undefined, 'cơ sở chưa có hạng phòng không có trong bảng tồn');
  });

  await tt.test('Cơ sở chưa duyệt/không tồn tại → 404', async () => {
    assert.equal((await call('GET', `/api/listings/khong-co/availability?checkIn=${mon}&checkOut=${wed}`)).status, 404);
  });
});
