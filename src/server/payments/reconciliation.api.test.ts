import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { MemoryStorage } from './storage.ts';
import { PaymentStore } from './store.ts';
import { HoldStore } from '../bookings/holds.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';
import { TERMS_VERSION } from '../../config/payment.ts';
import { RECON_DUE_MS } from './reconciliation.ts';

const mon = (() => {
  let d = addDays(todayInVietnam(), 3);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
})();
const rooms = {
  title: 'Homestay Mây (mẫu)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms: 2, availableRooms: 2, amenities: [], viewType: 'Sân vườn' }],
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9, 9]);

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const storage = new MemoryStorage();
  const ctx: ApiContext = { db, clientIp: '10.0.0.6', revidBaseUrl: '', revidApiKey: '', runtime: 'node', privateStorage: storage };
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
  const raw = (method: string, path: string, token?: string, body?: BodyInit, headers: Record<string, string> = {}) =>
    handleApiRequest(new Request(`http://local${path}`, { method, headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body }), ctx);
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const res = await raw(method, path, token, body === undefined ? undefined : JSON.stringify(body), body === undefined ? {} : { 'Content-Type': 'application/json' });
    return { status: res.status, body: (await res.json()) as any };
  };
  const file = async (id: string, token: string, bytes = PNG) => {
    const res = await raw('POST', `/api/bookings/${id}/reconciliation/files`, token, new Blob([bytes as BlobPart]), { 'Content-Type': 'image/png' });
    return { status: res.status, body: (await res.json()) as any };
  };
  const step = (id: string, action: string, token: string, body: unknown = {}) => call('POST', `/api/bookings/${id}/reconciliation/${action}`, token, body);
  const recon = async (id: string, token = t.guest) => (await call('GET', `/api/bookings/${id}/reconciliation`, token)).body.data;
  assert.equal((await call('PUT', '/api/admin/listings/homestay-may', t.admin, { content: rooms })).status, 200);
  assert.equal((await call('PUT', '/api/partner/listings/homestay-may/payout-account', t.ownerA, { bankBin: '970436', accountNumber: '0011004455667', accountName: 'Nguyen Van May' })).status, 200);
  let n = 0;
  /** Giữ chỗ → tick điều khoản → (tùy) gửi biên lai cọc */
  const paidHold = async (withReceipt = true) => {
    const q = await call('POST', '/api/quotes', undefined, { listingId: 'homestay-may', roomTypeId: 'r1', checkIn: mon, checkOut: addDays(mon, 2), adults: 2, rooms: 1 });
    const h = await call('POST', '/api/bookings/holds', t.guest, { quoteId: q.body.data.id, idempotencyKey: `r${++n}`, guestName: 'Khách Thử', guestPhone: '0981234567' });
    assert.equal(h.status, 201, JSON.stringify(h.body));
    await call('POST', `/api/bookings/${h.body.data.id}/payment/accept-terms`, t.guest, { termsVersion: TERMS_VERSION });
    if (withReceipt) {
      const r = await raw('POST', `/api/bookings/${h.body.data.id}/payment/receipts?kind=deposit`, t.guest, new Blob([PNG as BlobPart]), { 'Content-Type': 'image/png' });
      assert.equal(r.status, 201);
    }
    return h.body.data;
  };
  const expire = (at = new Date(Date.now() + 31 * 60_000)) => new HoldStore(db.d1).expireHolds(at);
  return { db, storage, t, call, raw, file, step, recon, paidHold, expire };
}

test('Đối soát mở khi giữ chỗ hết hạn mà khách đã gửi biên lai cọc; báo cả hai bên; hạn hoàn 3 ngày', async () => {
  const { t, call, recon, paidHold, expire } = await setup();
  const b = await paidHold();
  const noReceipt = await paidHold(false);
  const at = new Date(Date.now() + 31 * 60_000);
  await expire(at);
  await expire(at); // cron chạy lại không mở trùng
  const r = await recon(b.id);
  assert.equal(r.reconciliation.status, 'open');
  assert.equal(r.reconciliation.dueAt, new Date(at.getTime() + RECON_DUE_MS).toISOString());
  assert.equal(r.depositReceipts.length, 1, 'bằng chứng của khách đi kèm');
  assert.equal((await recon(noReceipt.id)).reconciliation, null, 'không có biên lai thì không mở');
  const ownerNotes = (await call('GET', '/api/notifications', t.ownerA)).body.data.items.filter((x: any) => x.kind === 'recon.opened');
  const guestNotes = (await call('GET', '/api/notifications', t.guest)).body.data.items.filter((x: any) => x.kind === 'recon.opened');
  assert.equal(ownerNotes.length, 1);
  assert.equal(guestNotes.length, 1);
  assert.equal((await call('GET', `/api/bookings/${b.id}/reconciliation`, t.other)).status, 403);
  assert.equal((await call('GET', `/api/bookings/${b.id}/reconciliation`, t.ownerB)).status, 403);
  const list = (await call('GET', '/api/partner/bookings', t.ownerA)).body.data.find((x: any) => x.id === b.id);
  assert.equal(list.needsReconciliation, true);
  assert.equal(list.reconStatus, 'open');
});

test('Cơ sở từ chối đơn khách đã gửi biên lai → mở đối soát; khách tự hủy (D03) thì không', async () => {
  const { t, call, recon, paidHold } = await setup();
  const b = await paidHold();
  await call('POST', `/api/bookings/${b.id}/reject`, t.ownerA, { reason: 'Hết phòng thật' });
  assert.equal((await recon(b.id)).reconciliation.status, 'open');
  const c = await paidHold();
  await call('POST', `/api/bookings/${c.id}/cancel`, t.guest, { reason: 'Đổi lịch' });
  assert.equal((await recon(c.id)).reconciliation, null);
});

test('Hoàn tiền: cơ sở phải có ảnh chứng từ và số tiền; khách xác nhận đã nhận thì đóng; lưu đủ bằng chứng và lịch sử', async () => {
  const { t, call, file, step, recon, paidHold, expire, raw } = await setup();
  const b = await paidHold();
  await expire();
  assert.equal((await step(b.id, 'refund', t.ownerA, { amount: 300000 })).body.code, 'PROOF_REQUIRED');
  assert.equal((await file(b.id, t.ownerB)).status, 403, 'chủ cơ sở khác không tải được');
  assert.equal((await file(b.id, t.ownerA, new TextEncoder().encode('gia mao'))).status, 415);
  const f = await file(b.id, t.ownerA);
  assert.equal(f.status, 201);
  assert.equal(f.body.data.role, 'owner');
  assert.equal((await step(b.id, 'refund', t.ownerA, { amount: 0 })).body.code, 'INVALID_AMOUNT');
  assert.equal((await step(b.id, 'refund', t.ownerA, { amount: 99_000_000 })).body.code, 'INVALID_AMOUNT', 'không quá tổng đơn');
  assert.equal((await step(b.id, 'refund', t.guest, { amount: 300000 })).status, 403);
  const ok = await step(b.id, 'refund', t.ownerA, { amount: 300000, note: 'Đã chuyển lại qua Vietcombank' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.reconciliation.status, 'refund_reported');
  assert.equal((await step(b.id, 'refund', t.ownerA, { amount: 300000 })).body.already, true);

  const g = await recon(b.id);
  assert.equal(g.reconciliation.refundAmount, 300000);
  assert.equal(g.files.filter((x: any) => x.role === 'owner').length, 1, 'khách thấy chứng từ hoàn');
  const img = await raw('GET', `/api/bookings/${b.id}/reconciliation/files/${f.body.data.id}`, t.guest);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('Content-Type'), 'image/png');
  assert.equal((await raw('GET', `/api/bookings/${b.id}/reconciliation/files/${f.body.data.id}`, t.other)).status, 403);

  assert.equal((await step(b.id, 'confirm_received', t.ownerA)).status, 403, 'cơ sở không tự xác nhận thay khách');
  const done = await step(b.id, 'confirm_received', t.guest);
  assert.equal(done.body.data.reconciliation.status, 'closed');
  assert.equal(done.body.data.reconciliation.outcome, 'refunded');
  assert.equal((await step(b.id, 'dispute', t.guest, { note: 'thử lại sau khi đóng' })).body.code, 'CLOSED');
  assert.equal((await file(b.id, t.guest)).body.code, 'CLOSED', 'đóng rồi không thêm bằng chứng');
  const actions = (await recon(b.id)).events.map((e: any) => e.action);
  assert.deepEqual(actions, ['recon_open', 'recon_refund', 'recon_confirm_received']);
  const ownerSees = (await call('GET', '/api/partner/bookings', t.ownerA)).body.data.find((x: any) => x.id === b.id);
  assert.equal(ownerSees.needsReconciliation, false);
});

test('Giữ tiền chỉ khi khách đồng ý; khách từ chối thì cơ sở phải hoàn', async () => {
  const { t, step, recon, paidHold, expire } = await setup();
  const b = await paidHold();
  await expire();
  assert.equal((await step(b.id, 'propose_hold', t.ownerA, { note: '' })).body.code, 'NOTE_REQUIRED');
  assert.equal((await step(b.id, 'propose_hold', t.ownerA, { note: 'Chuyển sang 20/12, cùng phòng' })).status, 200);
  assert.equal((await step(b.id, 'accept_hold', t.ownerA)).status, 403);
  const rej = await step(b.id, 'reject_hold', t.guest, { note: 'Tôi muốn nhận lại tiền' });
  assert.equal(rej.body.data.reconciliation.status, 'open');
  assert.equal((await step(b.id, 'propose_hold', t.ownerA, { note: 'Chuyển sang 27/12' })).status, 200);
  const acc = await step(b.id, 'accept_hold', t.guest);
  assert.equal(acc.body.data.reconciliation.outcome, 'held');
  assert.equal((await recon(b.id)).reconciliation.ownerNote, 'Chuyển sang 27/12', 'lưu nội dung khách đã đồng ý');
});

test('Quá hạn 3 ngày chưa hoàn: nhắc hai bên một lần; khách báo admin kèm ảnh; admin phân xử', async () => {
  const { db, t, call, file, step, recon, paidHold, expire } = await setup();
  const b = await paidHold();
  const at = new Date(Date.now() + 31 * 60_000);
  await expire(at);
  assert.equal((await step(b.id, 'dispute', t.guest, { note: 'Chưa thấy hoàn tiền' })).body.code, 'NOT_OVERDUE');
  const payments = new PaymentStore(db.d1);
  const late = new Date(at.getTime() + RECON_DUE_MS + 60_000);
  await payments.sendReconciliationReminders(late);
  await payments.sendReconciliationReminders(late);
  const overdueGuest = (await call('GET', '/api/notifications', t.guest)).body.data.items.filter((x: any) => x.kind === 'recon.overdue');
  const overdueOwner = (await call('GET', '/api/notifications', t.ownerA)).body.data.items.filter((x: any) => x.kind === 'recon.overdue');
  assert.equal(overdueGuest.length, 1);
  assert.equal(overdueOwner.length, 1);

  const disputeAt = await new PaymentStore(db.d1).reconAct(b.id, 'dispute', await actorOf(db, 'traveler.a@gmail.com'), { note: 'Quá 3 ngày chưa hoàn' }, late);
  assert.equal(disputeAt.ok, true, JSON.stringify(disputeAt));
  assert.equal((await file(b.id, t.guest)).status, 201, 'khách đính kèm ảnh sao kê');

  assert.equal((await step(b.id, 'resolve_refund_required', t.ownerA, { note: 'x' })).status, 403);
  assert.equal((await step(b.id, 'resolve_refund_required', t.admin, { note: '' })).body.code, 'NOTE_REQUIRED');
  const adminList = await call('GET', '/api/admin/reconciliations', t.admin);
  assert.equal(adminList.status, 200);
  assert.equal(adminList.body.data.find((x: any) => x.bookingId === b.id).status, 'disputed');
  assert.equal((await call('GET', '/api/admin/reconciliations', t.ownerA)).status, 403);

  const reopened = await step(b.id, 'resolve_refund_required', t.admin, { note: 'Sao kê cho thấy cơ sở đã nhận 300.000 đ, phải hoàn' });
  assert.equal(reopened.body.data.reconciliation.status, 'open');
  assert.ok(Date.parse(reopened.body.data.reconciliation.dueAt) > Date.now() + RECON_DUE_MS - 60_000, 'hạn mới 3 ngày');
  assert.match(reopened.body.data.reconciliation.adminNote, /phải hoàn/);
  const g = await recon(b.id, t.ownerA);
  assert.deepEqual(g.events.map((e: any) => e.action), ['recon_open', 'recon_dispute', 'recon_resolve_refund_required']);
});

test('Cơ sở báo đã hoàn nhưng khách chưa nhận → tranh chấp → admin kết luận đã hoàn', async () => {
  const { t, file, step, paidHold, expire } = await setup();
  const b = await paidHold();
  await expire();
  await file(b.id, t.ownerA);
  await step(b.id, 'refund', t.ownerA, { amount: 300000 });
  assert.equal((await step(b.id, 'dispute', t.guest, { note: 'Tài khoản tôi chưa nhận' })).body.data.reconciliation.status, 'disputed');
  const r = await step(b.id, 'resolve_refunded', t.admin, { note: 'Ngân hàng xác nhận lệnh chuyển thành công' });
  assert.equal(r.body.data.reconciliation.outcome, 'refunded');
});

async function actorOf(db: DatabaseEngine, email: string) {
  const p = await db.findProfileByEmail(email);
  return { id: p!.id, role: p!.role as any, providerId: null };
}

test('Khách bấm "Đã nhận lại tiền" nhiều lần cùng lúc chỉ ghi một lần', async () => {
  const { t, file, step, recon, paidHold, expire } = await setup();
  const b = await paidHold();
  await expire();
  await file(b.id, t.ownerA);
  await step(b.id, 'refund', t.ownerA, { amount: 300000 });
  const rs = await Promise.all([1, 2, 3].map(() => step(b.id, 'confirm_received', t.guest)));
  assert.ok(rs.every((r) => r.status === 200), JSON.stringify(rs.map((r) => r.body)));
  assert.equal(rs.filter((r) => r.body.already === false).length, 1);
  assert.equal((await recon(b.id)).events.filter((e: any) => e.action === 'recon_confirm_received').length, 1);
});
