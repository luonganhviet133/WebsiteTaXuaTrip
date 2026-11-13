import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPLAINT_WINDOW_DAYS, REFUND_DUE_MS, REVIEW_WINDOW_DAYS, complaintDecide, complaintDeadline, reviewDecide, canOpenComplaint,
} from './rules.ts';

const completed = { status: 'completed', completedAt: '2026-11-01T05:00:00.000Z' };

test('Đánh giá: chỉ khách của đơn đã hoàn tất, trong 30 ngày kể từ lúc hoàn tất (chủ dự án chốt)', () => {
  assert.equal(REVIEW_WINDOW_DAYS, 30);
  const day29 = Date.parse('2026-11-30T05:00:00.000Z');
  const day31 = Date.parse('2026-12-02T05:00:00.000Z');
  assert.deepEqual(reviewDecide(completed, ['guest'], day29), { ok: true });
  const late = reviewDecide(completed, ['guest'], day31);
  assert.equal(!late.ok && late.code, 'REVIEW_WINDOW_CLOSED');
  const notMine = reviewDecide(completed, ['owner'], day29);
  assert.equal(!notMine.ok && notMine.code, 'FORBIDDEN', 'cơ sở/admin không viết thay khách');
  for (const status of ['confirmed', 'checked_in', 'cancelled', 'pending_deposit']) {
    const r = reviewDecide({ status, completedAt: null }, ['guest'], day29);
    assert.equal(!r.ok && r.code, 'NOT_COMPLETED', `${status}: chưa ở xong thì chưa đánh giá`);
  }
});

test('Khiếu nại: mở từ khi cơ sở đã xác nhận cọc đến 7 ngày sau giờ trả phòng 12:00', () => {
  assert.equal(COMPLAINT_WINDOW_DAYS, 7);
  const b = { status: 'completed', confirmedAt: '2026-10-20T00:00:00Z', checkOutDate: '2026-11-02' };
  assert.equal(complaintDeadline('2026-11-02').toISOString(), '2026-11-09T05:00:00.000Z', '12:00 giờ VN ngày 09/11');
  assert.deepEqual(canOpenComplaint(b, ['guest'], Date.parse('2026-11-09T04:59:00Z')), { ok: true });
  const late = canOpenComplaint(b, ['guest'], Date.parse('2026-11-09T05:00:00Z'));
  assert.equal(!late.ok && late.code, 'COMPLAINT_WINDOW_CLOSED');
  const pending = canOpenComplaint({ ...b, status: 'pending_deposit', confirmedAt: null }, ['guest'], Date.parse('2026-10-01T00:00:00Z'));
  assert.equal(!pending.ok && pending.code, 'NOT_CONFIRMED', 'chưa có giao dịch được xác nhận');
  const expired = canOpenComplaint({ ...b, status: 'expired', confirmedAt: null }, ['guest'], Date.parse('2026-10-01T00:00:00Z'));
  assert.equal(!expired.ok && expired.code, 'NOT_CONFIRMED', 'cọc chưa xác nhận đã có đối soát cọc riêng');
  assert.deepEqual(canOpenComplaint({ ...b, status: 'cancelled' }, ['guest'], Date.parse('2026-11-03T00:00:00Z')), { ok: true }, 'đã xác nhận rồi bị hủy vẫn khiếu nại được');
  const owner = canOpenComplaint(b, ['owner'], Date.parse('2026-11-03T00:00:00Z'));
  assert.equal(!owner.ok && owner.code, 'FORBIDDEN');
});

const now = Date.parse('2026-11-20T00:00:00Z');
const at = (status: any, extra: any = {}) => ({ status, refundDueAt: null, ...extra });

test('Khiếu nại: admin nhận xử lý; cơ sở trả lời không đổi trạng thái; khách rút khi chưa kết luận', () => {
  assert.deepEqual(complaintDecide('assign', at('open'), ['admin'], { now }), { kind: 'apply', from: 'open', to: 'in_review' });
  assert.equal(complaintDecide('assign', at('open'), ['owner'], { now }).kind, 'deny');
  assert.deepEqual(complaintDecide('assign', at('in_review'), ['admin'], { now }), { kind: 'already' });
  assert.deepEqual(complaintDecide('respond', at('open'), ['owner'], { now }), { kind: 'apply', from: 'open', to: 'open' });
  assert.deepEqual(complaintDecide('respond', at('in_review'), ['owner'], { now }), { kind: 'apply', from: 'in_review', to: 'in_review' });
  assert.equal(complaintDecide('respond', at('open'), ['guest'], { now }).kind, 'deny');
  assert.deepEqual(complaintDecide('withdraw', at('open'), ['guest'], { now }), { kind: 'apply', from: 'open', to: 'closed', outcome: 'withdrawn' });
  assert.equal(complaintDecide('withdraw', at('refund_pending'), ['guest'], { now }).kind, 'deny', 'đã kết luận thì không rút');
});

test('Kết luận tách khỏi hoàn tiền: không hoàn → đóng; có số tiền hoàn → chờ cơ sở hoàn trong 3 ngày', () => {
  assert.equal(REFUND_DUE_MS, 3 * 24 * 3600_000);
  assert.deepEqual(complaintDecide('conclude', at('in_review'), ['admin'], { now, conclusion: 'rejected', refundAmount: 0 }), {
    kind: 'apply', from: 'in_review', to: 'closed', outcome: 'rejected',
  });
  assert.deepEqual(complaintDecide('conclude', at('in_review'), ['admin'], { now, conclusion: 'upheld', refundAmount: 0 }), {
    kind: 'apply', from: 'in_review', to: 'closed', outcome: 'upheld',
  });
  assert.deepEqual(complaintDecide('conclude', at('in_review'), ['admin'], { now, conclusion: 'upheld', refundAmount: 200000 }), {
    kind: 'apply', from: 'in_review', to: 'refund_pending', newRefundDueAt: new Date(now + REFUND_DUE_MS).toISOString(),
  });
  const bad = complaintDecide('conclude', at('in_review'), ['admin'], { now, conclusion: 'rejected', refundAmount: 100 });
  assert.equal(bad.kind === 'deny' && bad.code, 'INVALID_REFUND', 'bác khiếu nại mà vẫn hoàn là mâu thuẫn');
  assert.equal(complaintDecide('conclude', at('open'), ['admin'], { now, conclusion: 'upheld', refundAmount: 0 }).kind, 'deny', 'phải nhận xử lý trước');
  assert.equal(complaintDecide('conclude', at('in_review'), ['owner'], { now, conclusion: 'upheld', refundAmount: 0 }).kind, 'deny');
});

test('Hoàn tiền: cơ sở báo đã hoàn phải có chứng từ; khách xác nhận mới đóng là "đã hoàn"', () => {
  const pending = at('refund_pending', { refundDueAt: '2026-11-22T00:00:00Z' });
  const noProof = complaintDecide('report_refund', pending, ['owner'], { now, refundProofs: 0 });
  assert.equal(noProof.kind === 'deny' && noProof.code, 'PROOF_REQUIRED');
  assert.deepEqual(complaintDecide('report_refund', pending, ['owner'], { now, refundProofs: 1 }), { kind: 'apply', from: 'refund_pending', to: 'refund_reported' });
  assert.equal(complaintDecide('report_refund', pending, ['guest'], { now, refundProofs: 1 }).kind, 'deny');
  const reported = at('refund_reported');
  assert.deepEqual(complaintDecide('confirm_refund', reported, ['guest'], { now }), { kind: 'apply', from: 'refund_reported', to: 'closed', outcome: 'refunded' });
  assert.equal(complaintDecide('confirm_refund', reported, ['owner'], { now }).kind, 'deny', 'cơ sở không tự xác nhận thay khách');
  assert.equal(complaintDecide('confirm_refund', reported, ['admin'], { now }).kind, 'deny', 'admin không coi là đã hoàn khi khách chưa xác nhận');
  assert.deepEqual(complaintDecide('refund_not_received', reported, ['guest'], { now }), { kind: 'apply', from: 'refund_reported', to: 'refund_disputed' });
});

test('Quá hạn hoàn: khách báo được; chưa quá hạn thì chờ. Admin phân xử khi khách báo chưa nhận', () => {
  const notDue = complaintDecide('refund_not_received', at('refund_pending', { refundDueAt: '2026-11-22T00:00:00Z' }), ['guest'], { now });
  assert.equal(notDue.kind === 'deny' && notDue.code, 'NOT_OVERDUE');
  assert.deepEqual(complaintDecide('refund_not_received', at('refund_pending', { refundDueAt: '2026-11-19T00:00:00Z' }), ['guest'], { now }), {
    kind: 'apply', from: 'refund_pending', to: 'refund_disputed',
  });
  const disputed = at('refund_disputed');
  assert.deepEqual(complaintDecide('admin_confirm_refund', disputed, ['admin'], { now }), { kind: 'apply', from: 'refund_disputed', to: 'closed', outcome: 'refunded' });
  assert.deepEqual(complaintDecide('require_refund', disputed, ['admin'], { now }), {
    kind: 'apply', from: 'refund_disputed', to: 'refund_pending', newRefundDueAt: new Date(now + REFUND_DUE_MS).toISOString(),
  });
  assert.equal(complaintDecide('admin_confirm_refund', at('refund_reported'), ['admin'], { now }).kind, 'deny', 'chỉ phân xử khi khách đã báo chưa nhận');
});

test('Khiếu nại đã đóng thì không thao tác thêm; bấm lặp đúng bước cuối trả "đã làm"', () => {
  const closed = at('closed', { outcome: 'refunded' });
  assert.deepEqual(complaintDecide('confirm_refund', closed, ['guest'], { now }), { kind: 'already' });
  const r = complaintDecide('respond', closed, ['owner'], { now });
  assert.equal(r.kind === 'deny' && r.code, 'CLOSED');
  const w = complaintDecide('withdraw', at('closed', { outcome: 'rejected' }), ['guest'], { now });
  assert.equal(w.kind === 'deny' && w.code, 'CLOSED', 'đóng vì lý do khác thì không coi là đã rút');
});
