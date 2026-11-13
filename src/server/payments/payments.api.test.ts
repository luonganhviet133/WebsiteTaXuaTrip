import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { MemoryStorage } from './storage.ts';
import { PaymentStore } from './store.ts';
import { BookingLifecycle } from '../bookings/store.ts';
import { HoldStore } from '../bookings/holds.ts';
import { InventoryStore } from '../inventory/store.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';
import { TERMS_VERSION, balanceDueAt, checkInAt } from '../../config/payment.ts';

const mon = (() => {
  let d = addDays(todayInVietnam(), 3);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
})();
const wed = addDays(mon, 2);

const rooms = (totalRooms: number) => ({
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms, availableRooms: totalRooms, amenities: [], viewType: 'Sân vườn' }],
});

// Ảnh thật tối thiểu: chữ ký PNG / JPEG / WebP ở đầu file
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 1, 2, 3]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20]);
const TEXT = new TextEncoder().encode('<script>alert(1)</script>');

async function setup(totalRooms = 2) {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const storage = new MemoryStorage();
  const ctx: ApiContext = { db, clientIp: '10.0.0.5', revidBaseUrl: '', revidApiKey: '', runtime: 'node', privateStorage: storage };
  const tokenOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    return (await db.createSession(p!.id, p!.role)).token;
  };
  const t = {
    admin: await tokenOf('admin@taxuatrip.vn'),
    ownerA: await tokenOf('partner.a@taxuatrip.vn'),
    ownerB: await tokenOf('partner.b@taxuatrip.vn'),
    guest: await tokenOf('traveler.a@gmail.com'),
    other: await tokenOf('traveler.b@gmail.com'),
  };
  const raw = async (method: string, path: string, token?: string, body?: BodyInit, headers: Record<string, string> = {}) => {
    const h: Record<string, string> = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    return handleApiRequest(new Request(`http://local${path}`, { method, headers: h, body }), ctx);
  };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const res = await raw(method, path, token, body === undefined ? undefined : JSON.stringify(body), body === undefined ? {} : { 'Content-Type': 'application/json' });
    return { status: res.status, body: (await res.json()) as any };
  };
  const upload = async (id: string, kind: string, bytes: Uint8Array, token = t.guest, type = 'image/png') => {
    const res = await raw('POST', `/api/bookings/${id}/payment/receipts?kind=${kind}`, token, new Blob([bytes as BlobPart]), { 'Content-Type': type });
    return { status: res.status, body: (await res.json()) as any };
  };
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: rooms(totalRooms) })).status, 200);
  let n = 0;
  const hold = async (checkIn = mon, checkOut = wed) => {
    const q = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn, checkOut, adults: 2, rooms: 1 });
    assert.equal(q.status, 200, JSON.stringify(q.body));
    const h = await call('POST', '/api/bookings/holds', t.guest, { quoteId: q.body.data.id, idempotencyKey: `p${++n}`, guestName: 'Khách Thử', guestPhone: '0981234567' });
    assert.equal(h.status, 201, JSON.stringify(h.body));
    return h.body.data;
  };
  const setPayout = (token = t.ownerA, body: any = { bankBin: '970436', accountNumber: '0011004455667', accountName: 'Nguyễn Văn Mây' }) =>
    call('PUT', '/api/partner/listings/homestay-may/payout-account', token, body);
  const accept = (id: string, token = t.guest, termsVersion = TERMS_VERSION) => call('POST', `/api/bookings/${id}/payment/accept-terms`, token, { termsVersion });
  const actorOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    const provider = await db.d1.prepare('SELECT id FROM providers WHERE user_id = ?').bind(p!.id).first<{ id: string }>();
    return { id: p!.id, role: p!.role as any, providerId: provider?.id ?? null };
  };
  const status = async (id: string) => (await db.d1.prepare('SELECT status FROM bookings WHERE id = ?').bind(id).first<{ status: string }>())!.status;
  const available = async () => (await new InventoryStore(db.d1).forListing('homestay-may', rooms(totalRooms).roomTypes as any, mon, wed, new Date()))[0].available;
  return { db, d1: db.d1, storage, call, raw, upload, t, hold, setPayout, accept, actorOf, status, available };
}

test('N06.1: tài khoản nhận cọc theo cơ sở — chỉ chủ cơ sở/admin đặt; kiểm ngân hàng, số tài khoản; tên không dấu', async () => {
  const { call, t, setPayout } = await setup();
  assert.equal((await setPayout(t.ownerB)).status, 403);
  assert.equal((await setPayout(t.guest)).status, 403);
  assert.equal((await setPayout(t.ownerA, { bankBin: '999999', accountNumber: '0011004455667', accountName: 'A B' })).body.code, 'INVALID_BANK');
  assert.equal((await setPayout(t.ownerA, { bankBin: '970436', accountNumber: '12ab', accountName: 'A B' })).body.code, 'INVALID_ACCOUNT');
  assert.equal((await setPayout(t.ownerA, { bankBin: '970436', accountNumber: '0011004455667', accountName: ' ' })).body.code, 'INVALID_ACCOUNT_NAME');
  const ok = await setPayout();
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.data, { bankBin: '970436', bankName: 'Vietcombank', accountNumber: '0011004455667', accountName: 'NGUYEN VAN MAY' });
  assert.equal((await call('GET', '/api/partner/listings/homestay-may/payout-account', t.ownerA)).body.data.accountName, 'NGUYEN VAN MAY');
  assert.equal((await call('GET', '/api/partner/listings/homestay-may/payout-account', t.ownerB)).status, 403);
});

test('N06.1: điều khoản trước thông tin chuyển cọc; snapshot người nhận/số tiền/nội dung không đổi khi cơ sở đổi tài khoản', async () => {
  const { call, t, hold, setPayout, accept } = await setup();
  const b = await hold();
  const before = await call('GET', `/api/bookings/${b.id}/payment`, t.guest);
  assert.equal(before.status, 200);
  assert.equal(before.body.data.termsAccepted, false);
  assert.equal(before.body.data.snapshot, null, 'chưa tick điều khoản thì không thấy tài khoản');
  assert.equal(before.body.data.termsVersion, TERMS_VERSION);
  assert.ok(before.body.data.termsPoints.length >= 3);

  assert.equal((await accept(b.id)).body.code, 'PAYOUT_NOT_SET', 'cơ sở chưa có tài khoản');
  await setPayout();
  assert.equal((await accept(b.id, t.guest, 'cu')).body.code, 'TERMS_OUTDATED');
  assert.equal((await accept(b.id, t.ownerA)).status, 403);
  assert.equal((await accept(b.id, t.other)).status, 403);

  const ok = await accept(b.id);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const s = ok.body.data.snapshot;
  assert.deepEqual(
    { ...s, vietQrDeposit: undefined, vietQrBalance: undefined },
    {
      bookingId: b.id, bookingCode: b.bookingCode, payeeBankBin: '970436', payeeBankName: 'Vietcombank', payeeAccountNumber: '0011004455667',
      payeeAccountName: 'NGUYEN VAN MAY', totalAmount: 1_000_000, depositAmount: 300_000, balanceAmount: 700_000,
      depositMemo: `${b.bookingCode} COC`, balanceMemo: `${b.bookingCode} CON LAI`, balanceDueAt: balanceDueAt(mon).toISOString(),
      termsVersion: TERMS_VERSION, vietQrDeposit: undefined, vietQrBalance: undefined,
    }
  );
  assert.match(s.vietQrDeposit, /^000201010212.*5406300000.*6304[0-9A-F]{4}$/);
  assert.match(s.vietQrBalance, /5406700000/);

  await setPayout(t.ownerA, { bankBin: '970422', accountNumber: '9999999999', accountName: 'Người Khác' });
  const again = await accept(b.id);
  assert.equal(again.body.data.snapshot.payeeAccountNumber, '0011004455667', 'đơn đã chụp giữ nguyên người nhận');
  const owner = await call('GET', `/api/bookings/${b.id}/payment`, t.ownerA);
  assert.equal(owner.body.data.snapshot.depositAmount, 300_000, 'chủ cơ sở thấy cùng số liệu');
  assert.equal((await call('GET', `/api/bookings/${b.id}/payment`, t.other)).status, 403);
});

test('N06.1: biên lai — ảnh thật, đúng chủ đơn, giới hạn số lượng/kích thước; tải lên không tự thành đã trả', async () => {
  const { call, raw, upload, t, hold, setPayout, accept, status, storage } = await setup();
  const b = await hold();
  await setPayout();
  assert.equal((await upload(b.id, 'deposit', PNG)).body.code, 'TERMS_REQUIRED');
  await accept(b.id);

  const fake = await upload(b.id, 'deposit', TEXT, t.guest, 'image/png');
  assert.equal(fake.status, 415, 'đuôi/kiểu khai báo là ảnh nhưng nội dung không phải');
  assert.equal(fake.body.code, 'NOT_AN_IMAGE');
  const big = new Uint8Array(5 * 1024 * 1024 + 1);
  big.set(PNG);
  assert.equal((await upload(b.id, 'deposit', big)).status, 413);
  assert.equal((await upload(b.id, 'deposit', PNG, t.other)).status, 403);
  assert.equal((await upload(b.id, 'deposit', PNG, t.ownerA)).status, 403, 'chủ cơ sở không nộp thay');
  assert.equal((await upload(b.id, 'balance', PNG)).body.code, 'INVALID_STATE', 'chưa xác nhận cọc thì chưa nộp 70%');
  assert.equal((await upload(b.id, 'nope', PNG)).status, 400);

  const r1 = await upload(b.id, 'deposit', PNG);
  assert.equal(r1.status, 201, JSON.stringify(r1.body));
  assert.equal(r1.body.data.contentType, 'image/png');
  assert.equal((await upload(b.id, 'deposit', JPEG, t.guest, 'image/jpeg')).status, 201);
  assert.equal((await upload(b.id, 'deposit', WEBP, t.guest, 'image/webp')).status, 201);
  assert.equal((await upload(b.id, 'deposit', PNG)).body.code, 'TOO_MANY_RECEIPTS');
  assert.equal(storage.objects.size, 3, 'ảnh bị từ chối không còn trong kho');

  assert.equal(await status(b.id), 'pending_deposit', 'tải biên lai không đổi trạng thái');
  const pay = await call('GET', `/api/bookings/${b.id}/payment`, t.guest);
  assert.equal(pay.body.data.depositConfirmedAt, null);
  assert.equal(pay.body.data.receipts.length, 3);

  const img = await raw('GET', `/api/bookings/${b.id}/payment/receipts/${r1.body.data.id}`, t.ownerA);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('Content-Type'), 'image/png');
  assert.equal(img.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(new Uint8Array(await img.arrayBuffer()), PNG);
  assert.equal((await raw('GET', `/api/bookings/${b.id}/payment/receipts/${r1.body.data.id}`, t.ownerB)).status, 403, 'chủ cơ sở khác không xem');
  assert.equal((await raw('GET', `/api/bookings/${b.id}/payment/receipts/${r1.body.data.id}`, t.other)).status, 403);
  assert.equal((await raw('GET', `/api/bookings/${b.id}/payment/receipts/khong-co`, t.guest)).status, 404);

  const na = await call('GET', '/api/notifications', t.ownerA);
  assert.ok(na.body.data.items.some((x: any) => x.kind === 'payment.receipt'), 'chủ cơ sở được báo có biên lai');
});

test('N06.1: khách không tự nhận đã trả; chủ cơ sở xác nhận cọc và 70% hiện cho khách; bấm lại không ghi thêm', async () => {
  const { call, t, hold, setPayout, accept, db } = await setup();
  const b = await hold();
  await setPayout();
  await accept(b.id);
  assert.equal((await call('POST', `/api/bookings/${b.id}/payment/confirm-balance`, t.guest)).status, 403);
  assert.equal((await call('POST', `/api/bookings/${b.id}/payment/confirm-balance`, t.ownerA)).body.code, 'INVALID_STATE', 'chưa nhận cọc');
  assert.equal((await call('POST', `/api/bookings/${b.id}/confirm`, t.guest)).status, 403);

  assert.equal((await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA)).status, 200);
  assert.equal((await call('POST', `/api/bookings/${b.id}/payment/confirm-balance`, t.ownerB)).status, 403);
  const results = await Promise.all([1, 2, 3].map(() => call('POST', `/api/bookings/${b.id}/payment/confirm-balance`, t.ownerA)));
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(results.filter((r) => r.body.already === false).length, 1);
  const ev = await db.d1.prepare("SELECT COUNT(*) AS n FROM booking_events WHERE booking_id = ? AND action = 'confirm_balance'").bind(b.id).first<{ n: number }>();
  assert.equal(ev!.n, 1);

  const pay = (await call('GET', `/api/bookings/${b.id}/payment`, t.guest)).body.data;
  assert.ok(pay.depositConfirmedAt, 'khách thấy cơ sở đã xác nhận cọc');
  assert.ok(pay.balanceConfirmedAt, 'khách thấy cơ sở đã xác nhận 70%');
  assert.equal(pay.balanceOverdue, false);
});

test('N06.1: nhả phòng chỉ khi quá hạn 70% và chưa trả đủ; cọc không hoàn; báo khách', async () => {
  const { call, t, hold, setPayout, accept, actorOf, status, available, d1 } = await setup(1);
  const b = await hold();
  await setPayout();
  await accept(b.id);
  assert.equal((await call('POST', `/api/bookings/${b.id}/release`, t.ownerA)).body.code, 'INVALID_STATE', 'chưa xác nhận cọc');
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  const early = await call('POST', `/api/bookings/${b.id}/release`, t.ownerA);
  assert.equal(early.status, 409);
  assert.equal(early.body.code, 'NOT_OVERDUE');
  assert.equal((await call('POST', `/api/bookings/${b.id}/release`, t.guest)).status, 403);

  const owner = await actorOf('partner.a@taxuatrip.vn');
  const after = new Date(balanceDueAt(mon).getTime() + 60_000);
  const store = new BookingLifecycle(d1);
  const r = await store.act(b.id, 'release', owner, {}, after);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(await status(b.id), 'cancelled');
  assert.equal(await available(), 1, 'trả phòng');
  const g = await call('GET', `/api/bookings/${b.id}`, t.guest);
  assert.match(g.body.data.cancelReason, /70%/);
  const ng = await call('GET', '/api/notifications', t.guest);
  assert.ok(ng.body.data.items.some((x: any) => x.kind === 'booking.released'));
});

test('N06.1: đã xác nhận đủ 70% thì không nhả phòng được kể cả quá hạn', async () => {
  const { call, t, hold, setPayout, accept, actorOf, d1 } = await setup();
  const b = await hold();
  await setPayout();
  await accept(b.id);
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  await call('POST', `/api/bookings/${b.id}/payment/confirm-balance`, t.ownerA);
  const r = await new BookingLifecycle(d1).act(b.id, 'release', await actorOf('partner.a@taxuatrip.vn'), {}, new Date(balanceDueAt(mon).getTime() + 60_000));
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.code, 'BALANCE_PAID');
});

test('N06.1: nhắc 70% ở mốc 48 giờ và 30 giờ, mỗi mốc một lần; đã trả đủ thì không nhắc', async () => {
  const { call, t, hold, setPayout, accept, d1 } = await setup();
  const b = await hold();
  await setPayout();
  await accept(b.id);
  await call('POST', `/api/bookings/${b.id}/confirm`, t.ownerA);
  const payments = new PaymentStore(d1);
  const at = (h: number) => new Date(checkInAt(mon).getTime() - h * 3600_000);
  const count = async () => (await call('GET', '/api/notifications', t.guest)).body.data.items.filter((x: any) => x.kind === 'payment.balance_reminder').length;
  await payments.sendBalanceReminders(at(49));
  assert.equal(await count(), 0);
  await payments.sendBalanceReminders(at(47));
  await payments.sendBalanceReminders(at(46));
  assert.equal(await count(), 1, 'mốc 48 giờ một lần');
  await payments.sendBalanceReminders(at(29));
  assert.equal(await count(), 2, 'thêm mốc 30 giờ');
  await payments.sendBalanceReminders(at(28));
  assert.equal(await count(), 2);

  const b2 = await hold(addDays(mon, 7), addDays(mon, 8));
  await accept(b2.id);
  await call('POST', `/api/bookings/${b2.id}/confirm`, t.ownerA);
  await call('POST', `/api/bookings/${b2.id}/payment/confirm-balance`, t.ownerA);
  await payments.sendBalanceReminders(new Date(checkInAt(addDays(mon, 7)).getTime() - 29 * 3600_000));
  const items = (await call('GET', '/api/notifications', t.guest)).body.data.items.filter((x: any) => x.kind === 'payment.balance_reminder');
  assert.ok(items.every((x: any) => x.bookingId !== b2.id), 'đơn đã trả đủ không bị nhắc');
});

test('N06.1: biên lai cọc đến khi giữ chỗ đã hết hạn → cần đối soát, không tự xác nhận lại phòng', async () => {
  const { call, upload, t, hold, setPayout, accept, actorOf, d1 } = await setup();
  const b = await hold();
  await setPayout();
  await accept(b.id);
  assert.equal((await upload(b.id, 'deposit', PNG)).status, 201);
  const later = new Date(Date.now() + 31 * 60_000);
  await new HoldStore(d1).expireHolds(later);
  const r = await new BookingLifecycle(d1).act(b.id, 'confirm', await actorOf('partner.a@taxuatrip.vn'), {}, later);
  assert.equal(!r.ok && r.code, 'HOLD_EXPIRED');
  const list = await call('GET', '/api/partner/bookings', t.ownerA);
  const row = list.body.data.find((x: any) => x.id === b.id);
  assert.equal(row.status, 'expired');
  assert.equal(row.depositReceipts, 1);
  assert.equal(row.needsReconciliation, true);
  assert.equal((await upload(b.id, 'deposit', PNG)).body.code, 'INVALID_STATE', 'đơn hết hạn không nhận thêm biên lai');
});

