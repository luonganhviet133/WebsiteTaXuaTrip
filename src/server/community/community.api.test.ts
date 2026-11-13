import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { BookingLifecycle } from '../bookings/store.ts';
import { CommunityStore } from './store.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';
import { previousVnMonth, vnMonth } from '../../config/community.ts';

const rooms = {
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms: 5, availableRooms: 5, amenities: [], viewType: 'Sân vườn' }],
};

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = { db, clientIp: '10.0.0.7', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  const profile = async (email: string) => (await db.findProfileByEmail(email))!;
  const tokenOf = async (email: string) => {
    const p = await profile(email);
    return (await db.createSession(p.id, p.role)).token;
  };
  const t = {
    admin: await tokenOf('admin@taxuatrip.vn'),
    ownerA: await tokenOf('partner.a@taxuatrip.vn'),
    ownerB: await tokenOf('partner.b@taxuatrip.vn'),
    guest: await tokenOf('traveler.a@gmail.com'),
    other: await tokenOf('traveler.b@gmail.com'),
  };
  const guestId = (await profile('traveler.a@gmail.com')).id;
  const otherId = (await profile('traveler.b@gmail.com')).id;
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: rooms })).status, 200);
  const owner = await (async () => {
    const p = await profile('partner.a@taxuatrip.vn');
    const pr = await db.d1.prepare('SELECT id FROM providers WHERE user_id = ?').bind(p.id).first<{ id: string }>();
    return { id: p.id, role: 'partner' as const, providerId: pr!.id };
  })();
  let n = 0;
  /** Đơn hôm nay → xác nhận cọc → nhận phòng (QR) → trả về id (chưa hoàn tất) */
  const checkedIn = async (token = t.guest, nights = 1) => {
    const today = todayInVietnam();
    const q = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn: today, checkOut: addDays(today, nights), adults: 2, rooms: 1 });
    const h = await call('POST', '/api/bookings/holds', token, { quoteId: q.body.data.id, idempotencyKey: `c${++n}`, guestName: 'Khách Thử', guestPhone: '0981234567' });
    assert.equal(h.status, 201, JSON.stringify(h.body));
    const id = h.body.data.id;
    assert.equal((await call('POST', `/api/bookings/${id}/confirm`, t.ownerA)).status, 200);
    const qr = (await call('GET', `/api/bookings/${id}`, token)).body.data.checkinToken;
    const r = await new BookingLifecycle(db.d1).checkInByToken(qr, owner, new Date());
    assert.equal(r.ok, true, JSON.stringify(r));
    return { id, total: h.body.data.totalAmount as number };
  };
  const setRate = (body: unknown, token = t.admin) => call('PUT', '/api/admin/fees/rates/homestay-may', token, body);
  const pointsRows = async (userId: string) =>
    (await db.d1.prepare('SELECT source_type, source_id, points FROM points_ledger WHERE user_id = ? ORDER BY rowid').bind(userId).all<any>()).results.map((r: any) => ({ ...r }));
  const feeRows = async () => (await db.d1.prepare('SELECT booking_id, kind, amount, rate_mode, rate_value FROM fee_ledger ORDER BY rowid').all<any>()).results.map((r: any) => ({ ...r }));
  return { db, t, call, checkedIn, setRate, pointsRows, feeRows, guestId, otherId };
}

test('Hoàn tất đơn: +20 Điểm Mây cho khách và một dòng phí theo mức của cơ sở; hoàn tất lặp/đồng thời chỉ ghi một lần', async () => {
  const { t, call, checkedIn, setRate, pointsRows, feeRows, guestId } = await setup();
  assert.equal((await setRate({ mode: 'percent_bp', value: 500, note: 'Thỏa thuận 5%' })).status, 200);
  const b = await checkedIn();
  const rs = await Promise.all([1, 2, 3].map(() => call('POST', `/api/bookings/${b.id}/complete`, t.ownerA)));
  assert.ok(rs.every((r) => r.status === 200), JSON.stringify(rs.map((r) => r.body)));
  assert.equal(rs.filter((r) => r.body.already === false).length, 1);
  assert.equal((await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA)).body.already, true);
  assert.deepEqual(await pointsRows(guestId), [{ source_type: 'stay_completed', source_id: b.id, points: 20 }]);
  assert.deepEqual(await feeRows(), [{ booking_id: b.id, kind: 'platform_fee', amount: Math.floor((b.total * 500 + 5000) / 10000), rate_mode: 'percent_bp', rate_value: 500 }]);
});

test('Chưa hoàn tất thì không có điểm, không có phí; cơ sở chưa cài mức phí thì chỉ cộng điểm', async () => {
  const { t, call, checkedIn, pointsRows, feeRows, guestId } = await setup();
  const b = await checkedIn();
  assert.deepEqual(await pointsRows(guestId), [], 'mới nhận phòng: chưa có điểm');
  assert.deepEqual(await feeRows(), []);
  await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA);
  assert.equal((await pointsRows(guestId)).length, 1);
  assert.deepEqual(await feeRows(), [], 'chưa cài mức phí');
});

test('Mức phí: chỉ admin cài; kiểm giá trị; đổi mức sau không đổi dòng phí đã ghi', async () => {
  const { t, call, checkedIn, setRate, feeRows } = await setup();
  assert.equal((await setRate({ mode: 'fixed', value: 50000 }, t.ownerA)).status, 403);
  assert.equal((await setRate({ mode: 'free', value: 1 })).body.code, 'INVALID_RATE');
  assert.equal((await setRate({ mode: 'percent_bp', value: 6000 })).body.code, 'INVALID_RATE', 'tối đa 50%');
  assert.equal((await setRate({ mode: 'fixed', value: -1 })).body.code, 'INVALID_RATE');
  await setRate({ mode: 'fixed', value: 50000 });
  const b = await checkedIn();
  await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA);
  await setRate({ mode: 'fixed', value: 80000 });
  assert.equal((await feeRows())[0].amount, 50000, 'dòng đã ghi giữ mức cũ');
  const rates = await call('GET', '/api/admin/fees/rates', t.admin);
  assert.equal(rates.body.data.find((x: any) => x.listingId === 'homestay-may').value, 80000);
});

test('Sổ phí: chủ cơ sở chỉ thấy cơ sở mình; admin đảo bằng dòng bù có lý do, đảo một lần', async () => {
  const { t, call, checkedIn, setRate, feeRows } = await setup();
  await setRate({ mode: 'fixed', value: 50000 });
  const b = await checkedIn();
  await call('POST', `/api/bookings/${b.id}/complete`, t.ownerA);
  const month = vnMonth(new Date());
  const mine = await call('GET', `/api/partner/fees?month=${month}`, t.ownerA);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.data.total, 50000);
  assert.equal(mine.body.data.entries.length, 1);
  assert.equal((await call('GET', `/api/partner/fees?month=${month}`, t.ownerB)).body.data.total, 0);
  assert.equal((await call('GET', `/api/partner/fees?month=${month}`, t.guest)).status, 403);

  const ledger = await call('GET', `/api/admin/fees/ledger?month=${month}`, t.admin);
  const entryId = ledger.body.data.entries[0].id;
  assert.equal((await call('POST', `/api/admin/fees/ledger/${entryId}/reverse`, t.ownerA, { reason: 'x' })).status, 403);
  assert.equal((await call('POST', `/api/admin/fees/ledger/${entryId}/reverse`, t.admin, { reason: '' })).body.code, 'REASON_REQUIRED');
  const rev = await Promise.all([1, 2].map(() => call('POST', `/api/admin/fees/ledger/${entryId}/reverse`, t.admin, { reason: 'Đơn khiếu nại, miễn phí' })));
  assert.equal(rev.filter((r) => r.status === 200).length, 1, 'đảo đồng thời chỉ một lần');
  assert.equal(rev.find((r) => r.status !== 200)!.body.code, 'ALREADY_REVERSED');
  assert.deepEqual((await feeRows()).map((r: any) => [r.kind, r.amount]), [['platform_fee', 50000], ['reversal', -50000]]);
  assert.equal((await call('GET', `/api/partner/fees?month=${month}`, t.ownerA)).body.data.total, 0);
});

test('Admin cộng/thu hồi Điểm Mây: có lý do, giới hạn, chống bấm lặp; thu hồi một lần, tính theo mốc dòng gốc', async () => {
  const { t, call, pointsRows, guestId } = await setup();
  const award = (body: any, token = t.admin) => call('POST', '/api/admin/points/award', token, body);
  assert.equal((await award({ userEmail: 'traveler.a@gmail.com', points: 50, reason: 'Góp ý giá', idempotencyKey: 'k1' }, t.ownerA)).status, 403);
  assert.equal((await award({ userEmail: 'traveler.a@gmail.com', points: 50, reason: '', idempotencyKey: 'k1' })).body.code, 'REASON_REQUIRED');
  assert.equal((await award({ userEmail: 'traveler.a@gmail.com', points: 501, reason: 'x y z', idempotencyKey: 'k1' })).body.code, 'INVALID_POINTS');
  assert.equal((await award({ userEmail: 'khong-co@x.vn', points: 10, reason: 'x y z', idempotencyKey: 'k1' })).status, 404);
  const a1 = await Promise.all([1, 2].map(() => award({ userEmail: 'traveler.a@gmail.com', points: 120, reason: 'Báo đường sạt lở chính xác', idempotencyKey: 'k1' })));
  assert.ok(a1.every((r) => r.status === 200));
  assert.equal((await pointsRows(guestId)).length, 1, 'cùng khóa chỉ ghi một lần');

  const me = await call('GET', '/api/me/points', t.guest);
  assert.equal(me.body.data.points12m, 120);
  assert.equal(me.body.data.title, 'Người săn mây');
  assert.deepEqual(me.body.data.next, { name: 'Thổ địa Tà Xùa', min: 300 });
  assert.equal(me.body.data.redemptionEnabled, false);

  const entryId = me.body.data.history[0].id;
  assert.equal((await call('POST', `/api/admin/points/${entryId}/revoke`, t.admin, { reason: '' })).body.code, 'REASON_REQUIRED');
  assert.equal((await call('POST', `/api/admin/points/${entryId}/revoke`, t.admin, { reason: 'Thông tin sai' })).status, 200);
  assert.equal((await call('POST', `/api/admin/points/${entryId}/revoke`, t.admin, { reason: 'Thông tin sai' })).body.code, 'ALREADY_REVERSED');
  assert.equal((await call('GET', '/api/me/points', t.guest)).body.data.points12m, 0);
  assert.equal((await pointsRows(guestId)).length, 2, 'không xóa dòng gốc');
});

test('Hạn 12 tháng: điểm cũ hơn 365 ngày không tính vào số dư/danh hiệu nhưng vẫn trong lịch sử', async () => {
  const { db, t, call, guestId } = await setup();
  const old = new Date(Date.now() - 400 * 86400_000).toISOString();
  await db.d1
    .prepare("INSERT INTO points_ledger (id, user_id, source_type, source_id, points, reason, effective_at, created_at) VALUES ('pl_old', ?, 'admin_award', 'old', 500, 'cũ', ?, ?)")
    .bind(guestId, old, old)
    .run();
  const me = (await call('GET', '/api/me/points', t.guest)).body.data;
  assert.equal(me.points12m, 0);
  assert.equal(me.lifetime, 500);
  assert.equal(me.title, 'Lữ khách mới');
  assert.equal(me.history.length, 1);
});

test('Bảng xếp hạng công khai: tên rút gọn, chỉ thành viên khách, theo tháng và 12 tháng, đã trừ thu hồi', async () => {
  const { t, call } = await setup();
  const award = (email: string, points: number, key: string) => call('POST', '/api/admin/points/award', t.admin, { userEmail: email, points, reason: 'Góp ý được duyệt', idempotencyKey: key });
  await award('traveler.a@gmail.com', 40, 'a1');
  await award('traveler.b@gmail.com', 90, 'b1');
  await award('partner.a@taxuatrip.vn', 300, 'p1');
  const lb = await call('GET', '/api/community/leaderboard?scope=month');
  assert.equal(lb.status, 200, 'không cần đăng nhập');
  const rows = lb.body.data.items;
  assert.equal(rows.length, 2, 'chủ cơ sở không vào bảng');
  assert.deepEqual(rows.map((r: any) => [r.rank, r.points]), [[1, 90], [2, 40]]);
  assert.ok(rows.every((r: any) => !/@|\d{6,}/.test(r.name)), 'không lộ email/SĐT');
  assert.ok(rows.every((r: any) => r.userId === undefined), 'không trả mã tài khoản');
  assert.equal(rows[0].title, 'Lữ khách mới');
  assert.equal((await call('GET', '/api/community/leaderboard?scope=12m')).body.data.items.length, 2);
  assert.equal((await call('GET', '/api/community/leaderboard?scope=month&month=2020-01')).body.data.items.length, 0);
  assert.equal((await call('GET', '/api/community/leaderboard?scope=month&month=abc')).status, 400);
});

test('Top 3 tháng: admin chốt tháng đã qua, ghi quà; mỗi hạng/người một lần; công khai không lộ ghi chú quà', async () => {
  const { db, t, call, guestId, otherId } = await setup();
  const prev = previousVnMonth(new Date());
  const at = `${prev}-15T05:00:00.000Z`;
  for (const [id, uid, pts] of [['x1', guestId, 70], ['x2', otherId, 150]] as const) {
    await db.d1
      .prepare("INSERT INTO points_ledger (id, user_id, source_type, source_id, points, reason, effective_at, created_at) VALUES (?, ?, 'admin_award', ?, ?, 'thử', ?, ?)")
      .bind(id, uid, id, pts, at, at)
      .run();
  }
  const m = await call('GET', `/api/admin/community/monthly?month=${prev}`, t.admin);
  assert.equal(m.status, 200);
  assert.deepEqual(m.body.data.ranking.slice(0, 2).map((r: any) => [r.rank, r.userId, r.points]), [[1, otherId, 150], [2, guestId, 70]]);
  assert.equal((await call('GET', `/api/admin/community/monthly?month=${prev}`, t.ownerA)).status, 403);

  const cur = vnMonth(new Date());
  assert.equal((await call('POST', `/api/admin/community/monthly/${cur}/award`, t.admin, { rank: 1, userId: otherId, giftNote: 'x' })).body.code, 'MONTH_NOT_FINISHED');
  assert.equal((await call('POST', `/api/admin/community/monthly/${prev}/award`, t.admin, { rank: 1, userId: otherId, giftNote: '' })).body.code, 'GIFT_REQUIRED');
  const ok = await call('POST', `/api/admin/community/monthly/${prev}/award`, t.admin, { rank: 1, userId: otherId, giftNote: '1 đêm homestay Mây + áo khoác' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal((await call('POST', `/api/admin/community/monthly/${prev}/award`, t.admin, { rank: 1, userId: guestId, giftNote: 'Áo khoác' })).body.code, 'ALREADY_AWARDED');
  assert.equal((await call('POST', `/api/admin/community/monthly/${prev}/award`, t.admin, { rank: 2, userId: otherId, giftNote: 'Áo khoác' })).body.code, 'ALREADY_AWARDED');
  assert.equal((await call('POST', `/api/admin/community/monthly/${prev}/award`, t.admin, { rank: 2, userId: 'khong-co', giftNote: 'Áo khoác' })).status, 404);

  const pub = await call('GET', `/api/community/monthly-winners?month=${prev}`);
  assert.equal(pub.status, 200);
  assert.deepEqual(Object.keys(pub.body.data.winners[0]).sort(), ['name', 'points', 'rank']);
  const notes = (await call('GET', '/api/notifications', t.other)).body.data.items;
  assert.ok(notes.some((x: any) => x.kind === 'community.monthly_award'), 'người nhận được báo');
});

test('Đổi điểm lấy quà đang khóa; cơ chế (khi mở) không âm điểm, không tạo quà trùng khi bấm đồng thời', async () => {
  const { db, t, call, guestId } = await setup();
  assert.equal((await call('POST', '/api/me/points/redeem', t.guest, { rewardId: 'rw1', idempotencyKey: 'r1' })).body.code, 'REDEMPTION_DISABLED');
  const now = new Date().toISOString();
  await db.d1.prepare("INSERT INTO point_rewards (id, title, points_cost, active, created_at) VALUES ('rw1', 'Voucher thử', 50, 1, ?)").bind(now).run();
  await db.d1.prepare("INSERT INTO points_ledger (id, user_id, source_type, source_id, points, effective_at, created_at) VALUES ('g1', ?, 'admin_award', 'g1', 60, ?, ?)").bind(guestId, now, now).run();
  const store = new CommunityStore(db.d1, { redemptionEnabled: true });
  const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => store.redeem(guestId, 'rw1', `key-${i}`)));
  assert.equal(rs.filter((r) => r.ok).length, 1, JSON.stringify(rs));
  assert.ok(rs.filter((r) => !r.ok).every((r) => !r.ok && r.code === 'NOT_ENOUGH_POINTS'));
  const bal = await db.d1.prepare('SELECT SUM(points) AS s FROM points_ledger WHERE user_id = ?').bind(guestId).first<{ s: number }>();
  assert.equal(bal!.s, 10, 'không âm');
  const ok = rs.find((r) => r.ok)!;
  const replay = await store.redeem(guestId, 'rw1', (ok as any).idempotencyKey);
  assert.equal(replay.ok && replay.giftCode, (ok as any).giftCode, 'gửi lại cùng khóa trả cùng mã quà');
  assert.equal((await db.d1.prepare('SELECT COUNT(*) AS n FROM point_redemptions').first<{ n: number }>())!.n, 1);
});
