import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { BookingLifecycle } from '../bookings/store.ts';
import { MemoryStorage } from '../payments/storage.ts';
import { FeedbackStore } from './store.ts';
import { REFUND_DUE_MS } from './rules.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';

const rooms = {
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms: 5, availableRooms: 5, amenities: [], viewType: 'Sân vườn' }],
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9, 9]);
const COMMENT = 'Phòng sạch, chủ nhà nhiệt tình, sáng dậy thấy biển mây ngay trước hiên.';
const DAY = 86400_000;

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const storage = new MemoryStorage();
  const ctx: ApiContext = { db, clientIp: '10.0.0.9', revidBaseUrl: '', revidApiKey: '', runtime: 'node', privateStorage: storage };
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
  const raw = (method: string, path: string, token?: string, body?: BodyInit, headers: Record<string, string> = {}) =>
    handleApiRequest(new Request(`http://local${path}`, { method, headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body }), ctx);
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const res = await raw(method, path, token, body === undefined ? undefined : JSON.stringify(body), body === undefined ? {} : { 'Content-Type': 'application/json' });
    return { status: res.status, body: (await res.json()) as any };
  };
  const upload = async (path: string, token: string, bytes = PNG) => {
    const res = await raw('POST', path, token, new Blob([bytes as BlobPart]), { 'Content-Type': 'image/png' });
    return { status: res.status, body: (await res.json()) as any };
  };
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: rooms })).status, 200);
  const ownerActor = async (email: string) => {
    const p = await profile(email);
    const pr = await db.d1.prepare('SELECT id FROM providers WHERE user_id = ?').bind(p.id).first<{ id: string }>();
    return { id: p.id, role: p.role as any, providerId: pr?.id ?? null };
  };
  const owner = await ownerActor('partner.a@taxuatrip.vn');
  const guestActor = { id: guestId, role: 'traveler' as const, providerId: null };
  const adminActor = await ownerActor('admin@taxuatrip.vn');
  let n = 0;
  /** Đơn hôm nay → cơ sở xác nhận cọc (→ tùy chọn nhận phòng, hoàn tất) */
  const booking = async (stage: 'confirmed' | 'completed', token = t.guest) => {
    const today = todayInVietnam();
    const q = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn: today, checkOut: addDays(today, 1), adults: 2, rooms: 1 });
    const h = await call('POST', '/api/bookings/holds', token, { quoteId: q.body.data.id, idempotencyKey: `f${++n}`, guestName: 'Nguyễn Văn Khách', guestPhone: '0981234567' });
    assert.equal(h.status, 201, JSON.stringify(h.body));
    const id = h.body.data.id as string;
    assert.equal((await call('POST', `/api/bookings/${id}/confirm`, t.ownerA)).status, 200);
    if (stage === 'completed') {
      const qr = (await call('GET', `/api/bookings/${id}`, token)).body.data.checkinToken;
      assert.equal((await new BookingLifecycle(db.d1).checkInByToken(qr, owner, new Date())).ok, true);
      assert.equal((await call('POST', `/api/bookings/${id}/complete`, t.ownerA)).status, 200);
    }
    return { id, total: h.body.data.totalAmount as number };
  };
  const points = async () =>
    (await db.d1.prepare('SELECT source_type, points FROM points_ledger WHERE user_id = ? ORDER BY rowid').bind(guestId).all<any>()).results.map((r: any) => ({ ...r }));
  const store = new FeedbackStore(db.d1, storage);
  return { db, t, call, raw, upload, booking, points, store, guestActor, adminActor, owner };
}

test('Đánh giá xác thực: chỉ khách của đơn đã hoàn tất, một lần; +30 Điểm Mây; điểm sao cơ sở lấy từ đánh giá thật', async () => {
  const { t, call, booking, points } = await setup();
  const pending = await booking('confirmed');
  const early = await call('POST', `/api/bookings/${pending.id}/review`, t.guest, { rating: 5, comment: COMMENT });
  assert.equal(early.body.code, 'NOT_COMPLETED', 'chưa hoàn tất thì chưa viết được');

  const b = await booking('completed');
  assert.equal((await call('POST', `/api/bookings/${b.id}/review`, t.other, { rating: 1, comment: COMMENT })).status, 403, 'người không đặt đơn');
  assert.equal((await call('POST', `/api/bookings/${b.id}/review`, t.ownerA, { rating: 5, comment: COMMENT })).status, 403, 'cơ sở không tự viết');
  assert.equal((await call('POST', `/api/bookings/${b.id}/review`, t.guest, { rating: 5, comment: 'Tốt' })).body.code, 'COMMENT_TOO_SHORT');
  assert.equal((await call('POST', `/api/bookings/${b.id}/review`, t.guest, { rating: 6, comment: COMMENT })).body.code, 'INVALID_RATING');

  const rs = await Promise.all([1, 2, 3].map(() => call('POST', `/api/bookings/${b.id}/review`, t.guest, { rating: 4, comment: COMMENT })));
  assert.equal(rs.filter((r) => r.status === 201).length, 1, JSON.stringify(rs.map((r) => r.body)));
  assert.ok(rs.filter((r) => r.status !== 201).every((r) => r.body.code === 'ALREADY_REVIEWED'));
  assert.deepEqual(await points(), [{ source_type: 'stay_completed', points: 20 }, { source_type: 'review', points: 30 }], 'cộng một lần');

  const st = (await call('GET', `/api/bookings/${b.id}/review`, t.guest)).body.data;
  assert.equal(st.canWrite, false);
  assert.equal(st.review.rating, 4);
  const pub = (await call('GET', '/api/listings/homestay-may/reviews')).body.data;
  assert.equal(pub.count, 1);
  assert.equal(pub.average, 4);
  assert.equal(pub.items[0].authorName, 'Trần V. D. K. A.', 'tên tài khoản, rút gọn');
  assert.equal(pub.items[0].bookingId, undefined, 'không lộ mã đơn ra công khai');
  const listing = (await call('GET', '/api/listings/homestay-may')).body.data;
  assert.equal(listing.rating, 4);
  assert.equal(listing.reviewCount, 1);
});

test('Hết 30 ngày sau hoàn tất thì không viết được', async () => {
  const { booking, store, guestActor } = await setup();
  const b = await booking('completed');
  const r = await store.createReview(b.id, guestActor, { rating: 5, comment: COMMENT }, new Date(Date.now() + 31 * DAY));
  assert.equal(!r.ok && r.code, 'REVIEW_WINDOW_CLOSED');
  const ok = await store.createReview(b.id, guestActor, { rating: 5, comment: COMMENT }, new Date(Date.now() + 29 * DAY));
  assert.equal(ok.ok, true);
});

test('Ảnh thật: kiểm định dạng, tối đa 3 ảnh, +20 một lần; cơ sở trả lời; admin ẩn thì ảnh hết công khai và thu hồi điểm', async () => {
  const { t, call, raw, upload, booking, points } = await setup();
  const b = await booking('completed');
  assert.equal((await upload(`/api/bookings/${b.id}/review/photos`, t.guest)).body.code, 'NO_REVIEW');
  await call('POST', `/api/bookings/${b.id}/review`, t.guest, { rating: 5, comment: COMMENT });
  assert.equal((await upload(`/api/bookings/${b.id}/review/photos`, t.guest, new TextEncoder().encode('<svg onload=alert(1)>'))).status, 415);
  assert.equal((await upload(`/api/bookings/${b.id}/review/photos`, t.other)).status, 403);
  const p1 = await upload(`/api/bookings/${b.id}/review/photos`, t.guest);
  assert.equal(p1.status, 201);
  await upload(`/api/bookings/${b.id}/review/photos`, t.guest);
  await upload(`/api/bookings/${b.id}/review/photos`, t.guest);
  assert.equal((await upload(`/api/bookings/${b.id}/review/photos`, t.guest)).body.code, 'TOO_MANY_PHOTOS');
  assert.deepEqual((await points()).map((p) => p.points), [20, 30, 20], 'ảnh: +20 đúng một lần');
  const photo = await raw('GET', `/api/reviews/photos/${p1.body.data.id}`);
  assert.equal(photo.status, 200);
  assert.equal(photo.headers.get('Content-Type'), 'image/png');

  const reviewId = (await call('GET', `/api/bookings/${b.id}/review`, t.guest)).body.data.review.id;
  assert.equal((await call('POST', `/api/reviews/${reviewId}/reply`, t.ownerB, { reply: 'Cảm ơn bạn!' })).status, 403, 'cơ sở khác');
  assert.equal((await call('POST', `/api/reviews/${reviewId}/reply`, t.ownerA, { reply: 'Cảm ơn bạn đã ghé!' })).status, 200);
  assert.equal((await call('GET', '/api/listings/homestay-may/reviews')).body.data.items[0].ownerReply, 'Cảm ơn bạn đã ghé!');

  assert.equal((await call('POST', `/api/admin/reviews/${reviewId}/hide`, t.ownerA, { reason: 'x' })).status, 403);
  assert.equal((await call('POST', `/api/admin/reviews/${reviewId}/hide`, t.admin, {})).body.code, 'REASON_REQUIRED');
  const hs = await Promise.all([1, 2].map(() => call('POST', `/api/admin/reviews/${reviewId}/hide`, t.admin, { reason: 'Nội dung quảng cáo' })));
  assert.equal(hs.filter((h) => h.body.already === false).length, 1);
  assert.deepEqual((await points()).map((p) => p.points), [20, 30, 20, -30, -20], 'thu hồi đúng phần của đánh giá, giữ +20 hoàn tất');
  assert.equal((await raw('GET', `/api/reviews/photos/${p1.body.data.id}`)).status, 404, 'ảnh của đánh giá bị ẩn không còn công khai');
  assert.equal((await raw('GET', `/api/reviews/photos/${p1.body.data.id}`, t.admin)).status, 200, 'admin vẫn xem được');
  const pub = (await call('GET', '/api/listings/homestay-may/reviews')).body.data;
  assert.equal(pub.count, 0);
  assert.deepEqual(pub.items, [], 'đánh giá bị ẩn không còn trong danh sách công khai');
  assert.equal((await call('GET', '/api/listings/homestay-may')).body.data.rating, 0);
});

test('Khiếu nại: mở một lần, cơ sở trả lời, admin nhận xử lý rồi kết luận; hoàn tiền tách riêng và chỉ đóng khi khách xác nhận', async () => {
  const { t, call, upload, booking } = await setup();
  const b = await booking('confirmed');
  assert.equal((await call('POST', `/api/bookings/${b.id}/complaint`, t.other, { category: 'room', description: 'x'.repeat(30) })).status, 403);
  assert.equal((await call('POST', `/api/bookings/${b.id}/complaint`, t.guest, { category: 'room', description: 'ngắn' })).body.code, 'DESCRIPTION_TOO_SHORT');
  const opens = await Promise.all([1, 2].map(() => call('POST', `/api/bookings/${b.id}/complaint`, t.guest, { category: 'room', description: 'Phòng không có nước nóng như mô tả, báo chủ nhà nhưng không sửa.' })));
  assert.equal(opens.filter((o) => o.status === 201).length, 1, JSON.stringify(opens.map((o) => o.body)));
  assert.equal(opens.find((o) => o.status !== 201)!.body.code, 'COMPLAINT_EXISTS');
  assert.equal((await call('GET', `/api/bookings/${b.id}/complaint`, t.ownerB)).status, 403, 'cơ sở khác không xem được');

  const step = (action: string, token: string, body: unknown = {}) => call('POST', `/api/bookings/${b.id}/complaint/${action}`, token, body);
  assert.equal((await upload(`/api/bookings/${b.id}/complaint/files`, t.guest)).status, 201);
  assert.equal((await step('respond', t.ownerA, { note: 'Bình nóng lạnh hỏng đột xuất, đã sửa sáng hôm sau.' })).status, 200);
  assert.equal((await step('conclude', t.ownerA, { conclusion: 'rejected', note: 'x' })).status, 403, 'cơ sở không tự kết luận');
  assert.equal((await step('conclude', t.admin, { conclusion: 'upheld', refundAmount: 100000, note: 'Thiếu nước nóng đêm đầu' })).body.code, 'INVALID_STATE', 'phải nhận xử lý trước');
  const assigns = await Promise.all([1, 2].map(() => step('assign', t.admin)));
  assert.equal(assigns.filter((a) => a.body.already === false).length, 1, 'nhận xử lý đồng thời chỉ ghi một lần');
  assert.equal((await step('conclude', t.admin, { conclusion: 'upheld', refundAmount: b.total + 1, note: 'quá tổng' })).body.code, 'INVALID_REFUND');
  const c = await step('conclude', t.admin, { conclusion: 'upheld', refundAmount: 100000, note: 'Thiếu nước nóng đêm đầu, cơ sở hoàn một phần' });
  assert.equal(c.body.data.complaint.status, 'refund_pending', 'kết luận chưa phải là đã hoàn tiền');
  assert.equal(c.body.data.complaint.outcome, null);

  assert.equal((await step('report_refund', t.ownerA, { amount: 100000 })).body.code, 'PROOF_REQUIRED', 'ảnh của khách không tính là chứng từ hoàn');
  assert.equal((await upload(`/api/bookings/${b.id}/complaint/files`, t.ownerA)).status, 201);
  assert.equal((await step('report_refund', t.ownerA, { amount: 100000 })).body.data.complaint.status, 'refund_reported');
  assert.equal((await step('confirm_refund', t.ownerA)).status, 403);
  assert.equal((await step('confirm_refund', t.admin)).status, 403, 'admin không xác nhận thay khách');
  const done = await step('confirm_refund', t.guest);
  assert.equal(done.body.data.complaint.outcome, 'refunded');
  assert.equal((await step('confirm_refund', t.guest)).body.already, true);
  assert.deepEqual(
    done.body.data.events.map((e: any) => `${e.action}:${e.actorRole}`),
    ['open:traveler', 'respond:partner', 'assign:admin', 'conclude:admin', 'report_refund:partner', 'confirm_refund:traveler'],
    'lịch sử đủ người và bước'
  );
  assert.equal((await upload(`/api/bookings/${b.id}/complaint/files`, t.guest)).body.code, 'CLOSED');
  const list = (await call('GET', '/api/admin/complaints', t.admin)).body.data;
  assert.equal(list.length, 1);
  assert.equal((await call('GET', '/api/admin/complaints', t.ownerA)).status, 403);
});

test('Quá hạn hoàn: khách báo chưa nhận, admin yêu cầu hoàn lại với hạn mới; chứng từ cũ không tính cho đợt mới', async () => {
  const { booking, store, guestActor, adminActor, owner } = await setup();
  const b = await booking('confirmed');
  const t0 = Date.now();
  const at = (ms: number) => new Date(t0 + ms);
  assert.equal((await store.openComplaint(b.id, guestActor, { category: 'price', description: 'Cơ sở thu thêm 200.000đ phí sưởi không báo trước.' }, at(0))).ok, true);
  await store.complaintAct(b.id, 'assign', adminActor, {}, at(1000));
  await store.complaintAct(b.id, 'conclude', adminActor, { conclusion: 'upheld', refundAmount: 200000, note: 'Phí không có trong báo giá' }, at(2000));
  await store.uploadComplaintFile(b.id, owner, PNG, at(3000));
  const early = await store.complaintAct(b.id, 'refund_not_received', guestActor, { note: 'Chưa thấy tiền' }, at(DAY));
  assert.equal(!early.ok && early.code, 'NOT_OVERDUE');
  const late = await store.complaintAct(b.id, 'refund_not_received', guestActor, { note: 'Quá hạn chưa thấy tiền' }, at(REFUND_DUE_MS + 3000));
  assert.equal(late.ok && late.data.complaint?.status, 'refund_disputed');
  const req = await store.complaintAct(b.id, 'require_refund', adminActor, { note: 'Cơ sở hoàn trong 3 ngày' }, at(REFUND_DUE_MS + 5000));
  assert.equal(req.ok && req.data.complaint?.status, 'refund_pending');
  const stale = await store.complaintAct(b.id, 'report_refund', owner, { amount: 200000 }, at(REFUND_DUE_MS + 6000));
  assert.equal(!stale.ok && stale.code, 'PROOF_REQUIRED', 'ảnh gửi trước đợt mới không tính');
  await store.uploadComplaintFile(b.id, owner, PNG, at(REFUND_DUE_MS + 7000));
  const rep = await store.complaintAct(b.id, 'report_refund', owner, { amount: 200000 }, at(REFUND_DUE_MS + 8000));
  assert.equal(rep.ok && rep.data.complaint?.status, 'refund_reported');
});

test('Hạn mở khiếu nại: tới 7 ngày sau ngày trả phòng; rút rồi thì mở lại được', async () => {
  const { booking, store, guestActor } = await setup();
  const b = await booking('completed');
  const late = await store.openComplaint(b.id, guestActor, { category: 'service', description: 'Thái độ phục vụ không tốt khi nhận phòng muộn.' }, new Date(Date.now() + 9 * DAY));
  assert.equal(!late.ok && late.code, 'COMPLAINT_WINDOW_CLOSED');
  assert.equal((await store.openComplaint(b.id, guestActor, { category: 'service', description: 'Thái độ phục vụ không tốt khi nhận phòng muộn.' })).ok, true);
  const w = await store.complaintAct(b.id, 'withdraw', guestActor, {});
  assert.equal(w.ok && w.data.complaint?.outcome, 'withdrawn');
  const again = await store.openComplaint(b.id, guestActor, { category: 'room', description: 'Phát hiện thêm: ga giường bẩn, đã chụp ảnh.' });
  assert.equal(again.ok && again.data.complaint?.status, 'open');
});
