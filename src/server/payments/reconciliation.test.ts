import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECON_DUE_MS, reconDecide, shouldOpenReconciliation } from './reconciliation.ts';

const now = Date.parse('2026-11-20T00:00:00Z');
const open = { status: 'open' as const, dueAt: '2026-11-22T00:00:00Z' };

test('Mở đối soát khi khách đã gửi biên lai cọc nhưng đơn hết hạn hoặc bị cơ sở từ chối trước khi xác nhận; khách tự hủy theo D03 thì không', () => {
  assert.equal(RECON_DUE_MS, 3 * 24 * 3600_000, 'hạn hoàn 3 ngày (chủ dự án chốt)');
  assert.equal(shouldOpenReconciliation({ action: 'expire', depositReceipts: 1, confirmedAt: null }), true);
  assert.equal(shouldOpenReconciliation({ action: 'reject', depositReceipts: 2, confirmedAt: null }), true);
  assert.equal(shouldOpenReconciliation({ action: 'expire', depositReceipts: 0, confirmedAt: null }), false, 'không có biên lai');
  assert.equal(shouldOpenReconciliation({ action: 'cancel', depositReceipts: 1, confirmedAt: null }), false, 'khách tự hủy: D03 không hoàn');
  assert.equal(shouldOpenReconciliation({ action: 'release', depositReceipts: 1, confirmedAt: 'x' }), false, 'nhả phòng quá hạn 70%: D03 không hoàn');
});

test('Cơ sở: báo đã hoàn (kèm chứng từ) hoặc đề nghị giữ tiền khi đối soát đang mở', () => {
  assert.deepEqual(reconDecide('refund', open, ['owner'], { now, refundProofs: 1 }), { kind: 'apply', from: 'open', to: 'refund_reported' });
  const noProof = reconDecide('refund', open, ['owner'], { now, refundProofs: 0 });
  assert.equal(noProof.kind === 'deny' && noProof.code, 'PROOF_REQUIRED');
  assert.deepEqual(reconDecide('propose_hold', open, ['owner'], { now }), { kind: 'apply', from: 'open', to: 'hold_proposed' });
  assert.equal(reconDecide('refund', open, ['guest'], { now, refundProofs: 1 }).kind, 'deny', 'khách không tự báo đã hoàn');
  assert.equal(reconDecide('propose_hold', { ...open, status: 'refund_reported' }, ['owner'], { now }).kind, 'deny');
});

test('Giữ tiền chỉ khi khách đồng ý; khách từ chối thì quay về chờ hoàn', () => {
  const hold = { status: 'hold_proposed' as const, dueAt: open.dueAt };
  assert.deepEqual(reconDecide('accept_hold', hold, ['guest'], { now }), { kind: 'apply', from: 'hold_proposed', to: 'closed', outcome: 'held' });
  assert.deepEqual(reconDecide('reject_hold', hold, ['guest'], { now }), { kind: 'apply', from: 'hold_proposed', to: 'open' });
  assert.equal(reconDecide('accept_hold', hold, ['owner'], { now }).kind, 'deny', 'cơ sở không tự nhận thay khách');
});

test('Khách xác nhận đã nhận lại tiền thì đóng; chưa nhận thì thành tranh chấp', () => {
  const rep = { status: 'refund_reported' as const, dueAt: open.dueAt };
  assert.deepEqual(reconDecide('confirm_received', rep, ['guest'], { now }), { kind: 'apply', from: 'refund_reported', to: 'closed', outcome: 'refunded' });
  assert.deepEqual(reconDecide('dispute', rep, ['guest'], { now }), { kind: 'apply', from: 'refund_reported', to: 'disputed' });
  assert.equal(reconDecide('confirm_received', rep, ['owner'], { now }).kind, 'deny');
});

test('Khách báo admin khi quá hạn hoàn 3 ngày; chưa quá hạn thì chờ cơ sở', () => {
  const early = reconDecide('dispute', open, ['guest'], { now });
  assert.equal(early.kind === 'deny' && early.code, 'NOT_OVERDUE');
  assert.equal(reconDecide('dispute', open, ['guest'], { now: Date.parse('2026-11-22T00:00:01Z') }).kind, 'apply');
});

test('Admin phân xử tranh chấp: đã hoàn / được giữ (đóng) hoặc buộc hoàn (mở lại, hạn mới 3 ngày)', () => {
  const d = { status: 'disputed' as const, dueAt: open.dueAt };
  assert.deepEqual(reconDecide('resolve_refunded', d, ['admin'], { now }), { kind: 'apply', from: 'disputed', to: 'closed', outcome: 'refunded' });
  assert.deepEqual(reconDecide('resolve_held', d, ['admin'], { now }), { kind: 'apply', from: 'disputed', to: 'closed', outcome: 'held' });
  assert.deepEqual(reconDecide('resolve_refund_required', d, ['admin'], { now }), { kind: 'apply', from: 'disputed', to: 'open', newDueAt: new Date(now + RECON_DUE_MS).toISOString() });
  assert.equal(reconDecide('resolve_refunded', d, ['owner'], { now }).kind, 'deny');
  assert.equal(reconDecide('resolve_refunded', open, ['admin'], { now }).kind, 'deny', 'chỉ phân xử khi có tranh chấp');
});

test('Đã đóng thì không đổi nữa; làm lại cùng thao tác trả "đã làm"', () => {
  const closed = { status: 'closed' as const, dueAt: open.dueAt, outcome: 'refunded' as const };
  assert.equal(reconDecide('confirm_received', closed, ['guest'], { now }).kind, 'already');
  const r = reconDecide('dispute', closed, ['guest'], { now });
  assert.equal(r.kind === 'deny' && r.code, 'CLOSED');
  assert.equal(reconDecide('refund', { status: 'refund_reported', dueAt: open.dueAt }, ['owner'], { now, refundProofs: 1 }).kind, 'already');
});
