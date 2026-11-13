import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, TRANSITIONS, type DecideContext } from './lifecycle.ts';

const ctx = (over: Partial<DecideContext> = {}): DecideContext => ({
  today: '2026-11-20',
  checkIn: '2026-11-20',
  checkOut: '2026-11-22',
  holdExpired: false,
  ...over,
});

test('Bảng chuyển trạng thái: đúng trạng thái đích và người được làm', () => {
  assert.deepEqual(TRANSITIONS.confirm, { from: ['pending_deposit'], to: 'confirmed', who: ['owner', 'admin'] });
  assert.deepEqual(TRANSITIONS.reject, { from: ['pending_deposit'], to: 'cancelled', who: ['owner', 'admin'] });
  assert.deepEqual(TRANSITIONS.check_in, { from: ['confirmed'], to: 'checked_in', who: ['owner', 'admin'] });
  assert.deepEqual(TRANSITIONS.complete, { from: ['checked_in'], to: 'completed', who: ['owner', 'admin'] });
  assert.deepEqual(TRANSITIONS.cancel, { from: ['pending_deposit', 'confirmed'], to: 'cancelled', who: ['guest', 'admin'] });
});

test('Khách không tự xác nhận, nhận phòng, hoàn tất được', () => {
  assert.equal(decide('confirm', 'pending_deposit', ['guest'], ctx()).kind, 'deny');
  assert.equal(decide('check_in', 'confirmed', ['guest'], ctx()).kind, 'deny');
  const r = decide('complete', 'checked_in', ['guest'], ctx());
  assert.equal(r.kind, 'deny');
  if (r.kind === 'deny') assert.equal(r.status, 403);
});

test('Không đi tắt: đơn đã hủy/hết hạn không thành hoàn tất hay nhận phòng', () => {
  for (const s of ['cancelled', 'expired', 'pending_deposit', 'confirmed'] as const) {
    const r = decide('complete', s, ['owner'], ctx());
    assert.equal(r.kind, 'deny', s);
    if (r.kind === 'deny') assert.equal(r.code, s === 'expired' ? 'HOLD_EXPIRED' : 'INVALID_STATE');
  }
  const r = decide('check_in', 'cancelled', ['owner'], ctx());
  assert.equal(r.kind === 'deny' && r.code, 'INVALID_STATE');
});

test('Làm lại thao tác đã xong trả "đã làm", không áp lại', () => {
  assert.equal(decide('check_in', 'checked_in', ['owner'], ctx()).kind, 'already');
  assert.equal(decide('complete', 'completed', ['admin'], ctx()).kind, 'already');
  assert.equal(decide('confirm', 'confirmed', ['owner'], ctx()).kind, 'already');
  assert.equal(decide('cancel', 'cancelled', ['guest'], ctx()).kind, 'already');
  // Người không có quyền vẫn bị chặn trước
  assert.equal(decide('check_in', 'checked_in', ['guest'], ctx()).kind, 'deny');
});

test('Giữ chỗ quá hạn: không xác nhận, không từ chối, không hủy được', () => {
  for (const a of ['confirm', 'reject', 'cancel'] as const) {
    const r = decide(a, 'pending_deposit', ['owner', 'guest', 'admin'], ctx({ holdExpired: true }));
    assert.equal(r.kind === 'deny' && r.code, 'HOLD_EXPIRED', a);
  }
});

test('Nhận phòng chỉ từ ngày nhận phòng tới trước ngày trả phòng', () => {
  const early = decide('check_in', 'confirmed', ['owner'], ctx({ today: '2026-11-19' }));
  assert.equal(early.kind === 'deny' && early.code, 'TOO_EARLY');
  assert.equal(decide('check_in', 'confirmed', ['owner'], ctx({ today: '2026-11-20' })).kind, 'apply');
  assert.equal(decide('check_in', 'confirmed', ['owner'], ctx({ today: '2026-11-21' })).kind, 'apply');
  const late = decide('check_in', 'confirmed', ['owner'], ctx({ today: '2026-11-22' }));
  assert.equal(late.kind === 'deny' && late.code, 'QR_EXPIRED');
});

test('Khách hủy đơn đã xác nhận chỉ trước ngày nhận phòng; admin hủy được tới trước khi nhận phòng', () => {
  assert.equal(decide('cancel', 'confirmed', ['guest'], ctx({ today: '2026-11-19' })).kind, 'apply');
  const r = decide('cancel', 'confirmed', ['guest'], ctx({ today: '2026-11-20' }));
  assert.equal(r.kind === 'deny' && r.code, 'TOO_LATE_TO_CANCEL');
  assert.equal(decide('cancel', 'confirmed', ['admin'], ctx({ today: '2026-11-21' })).kind, 'apply');
  assert.equal(decide('cancel', 'checked_in', ['admin'], ctx()).kind, 'deny');
  // Chủ cơ sở chưa được tự hủy đơn đã xác nhận (chờ quy tắc 70% ở N06.1)
  assert.equal(decide('cancel', 'confirmed', ['owner'], ctx({ today: '2026-11-19' })).kind, 'deny');
});

test('N06.1: nhả phòng (D03) — chủ cơ sở/admin, đơn đã xác nhận, quá hạn 70% và chưa trả đủ', () => {
  assert.deepEqual(TRANSITIONS.release, { from: ['confirmed'], to: 'cancelled', who: ['owner', 'admin'] });
  assert.equal(decide('release', 'confirmed', ['owner'], ctx({ balanceOverdue: true })).kind, 'apply');
  assert.equal(decide('release', 'confirmed', ['guest'], ctx({ balanceOverdue: true })).kind, 'deny');
  const early = decide('release', 'confirmed', ['owner'], ctx({ balanceOverdue: false }));
  assert.equal(early.kind === 'deny' && early.code, 'NOT_OVERDUE');
  const paid = decide('release', 'confirmed', ['owner'], ctx({ balanceOverdue: true, balancePaid: true }));
  assert.equal(paid.kind === 'deny' && paid.code, 'BALANCE_PAID');
  const pending = decide('release', 'pending_deposit', ['owner'], ctx({ balanceOverdue: true }));
  assert.equal(pending.kind === 'deny' && pending.code, 'INVALID_STATE');
});
