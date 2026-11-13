import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkinUrl, formatCreatedAt, guestCanCancel, guestCountOf, ownerActions, parseCheckinInput, reconButtons, statusLabel } from './bookingsApi.ts';

const TOKEN = 'a'.repeat(20) + '_-' + 'B'.repeat(21); // 43 ký tự base64url

test('Đường dẫn QR nhận phòng và đọc lại mã từ đường dẫn hoặc mã dán tay', () => {
  const url = checkinUrl('https://taxua.example', TOKEN);
  assert.equal(url, `https://taxua.example/doi-tac/nhan-phong?ma=${TOKEN}`);
  assert.equal(parseCheckinInput(url), TOKEN);
  assert.equal(parseCheckinInput(`  ${TOKEN} `), TOKEN);
  assert.equal(parseCheckinInput('TX-1234'), null);
  assert.equal(parseCheckinInput('https://x.vn/doi-tac/nhan-phong?ma=ngan'), null);
});

test('Nút cho chủ cơ sở theo trạng thái (nhận phòng chỉ qua QR; 70% và nhả phòng theo D03)', () => {
  const now = Date.parse('2026-11-13T07:00:00Z');
  const b = (status: string, extra: Partial<{ holdExpiresAt: string | null; balanceConfirmedAt: string | null; checkInDate: string }> = {}) => ({
    status, holdExpiresAt: null, balanceConfirmedAt: null, checkInDate: '2026-11-20', ...extra,
  });
  assert.deepEqual(ownerActions(b('pending_deposit', { holdExpiresAt: '2026-11-13T07:10:00Z' }), now), ['confirm', 'reject']);
  assert.deepEqual(ownerActions(b('pending_deposit', { holdExpiresAt: '2026-11-13T06:59:00Z' }), now), [], 'giữ chỗ quá hạn');
  assert.deepEqual(ownerActions(b('confirmed'), now), ['confirm_balance']);
  // Hạn 70%: 14:00 ngày 19/11 (giờ VN) = 07:00Z
  assert.deepEqual(ownerActions(b('confirmed'), Date.parse('2026-11-19T07:00:00Z')), ['confirm_balance', 'release']);
  assert.deepEqual(ownerActions(b('confirmed', { balanceConfirmedAt: '2026-11-15T00:00:00Z' }), Date.parse('2026-11-19T08:00:00Z')), []);
  assert.deepEqual(ownerActions(b('checked_in'), now), ['confirm_balance', 'complete']);
  assert.deepEqual(ownerActions(b('checked_in', { balanceConfirmedAt: 'x' }), now), ['complete']);
  assert.deepEqual(ownerActions(b('completed'), now), []);
  assert.deepEqual(ownerActions(b('cancelled'), now), []);
});

test('Khách hủy được: giữ chỗ còn hạn; đơn đã xác nhận trước ngày nhận phòng', () => {
  const now = Date.parse('2026-11-13T07:00:00Z'); // 14:00 ngày 13/11 giờ VN
  assert.equal(guestCanCancel({ status: 'pending_deposit', holdExpiresAt: '2026-11-13T07:10:00Z', checkInDate: '2026-11-20' }, now), true);
  assert.equal(guestCanCancel({ status: 'pending_deposit', holdExpiresAt: '2026-11-13T06:00:00Z', checkInDate: '2026-11-20' }, now), false);
  assert.equal(guestCanCancel({ status: 'confirmed', holdExpiresAt: null, checkInDate: '2026-11-14' }, now), true);
  assert.equal(guestCanCancel({ status: 'confirmed', holdExpiresAt: null, checkInDate: '2026-11-13' }, now), false);
  assert.equal(guestCanCancel({ status: 'checked_in', holdExpiresAt: null, checkInDate: '2026-11-10' }, now), false);
});

test('Nhãn trạng thái tiếng Việt, giữ chỗ quá hạn hiện "Hết hạn giữ chỗ"', () => {
  const now = Date.parse('2026-11-13T07:00:00Z');
  assert.equal(statusLabel('pending_deposit', '2026-11-13T07:10:00Z', now), 'Giữ chỗ · Chờ cọc');
  assert.equal(statusLabel('pending_deposit', '2026-11-13T06:00:00Z', now), 'Hết hạn giữ chỗ');
  assert.equal(statusLabel('confirmed', null, now), 'Đã xác nhận');
  assert.equal(statusLabel('checked_in', null, now), 'Đã nhận phòng');
  assert.equal(statusLabel('completed', null, now), 'Hoàn tất');
  assert.equal(statusLabel('cancelled', null, now), 'Đã hủy');
});

test('Hiển thị đơn từ server: ngày đặt theo giờ VN, số khách = người lớn + trẻ em', () => {
  assert.equal(formatCreatedAt('2026-11-13T03:24:30.651Z'), '10:24 13/11/2026');
  assert.equal(formatCreatedAt('2026-11-13 10:00'), '2026-11-13 10:00', 'đơn cũ lưu trình duyệt giữ nguyên');
  assert.equal(guestCountOf({ adults: 2, children: 1 }), 3);
  assert.equal(guestCountOf({ guestsCount: 4 }), 4);
  assert.equal(guestCountOf({}), 0);
});

test('Đối soát cọc: nút theo vai trò và trạng thái (khớp bảng server)', () => {
  assert.deepEqual(reconButtons('owner', 'open', false), ['refund', 'propose_hold']);
  assert.deepEqual(reconButtons('owner', 'refund_reported', false), []);
  assert.deepEqual(reconButtons('guest', 'open', false), []);
  assert.deepEqual(reconButtons('guest', 'open', true), ['dispute'], 'quá hạn 3 ngày mới báo được');
  assert.deepEqual(reconButtons('guest', 'refund_reported', false), ['confirm_received', 'dispute']);
  assert.deepEqual(reconButtons('guest', 'hold_proposed', false), ['accept_hold', 'reject_hold']);
  assert.deepEqual(reconButtons('admin', 'disputed', false), ['resolve_refunded', 'resolve_held', 'resolve_refund_required']);
  assert.deepEqual(reconButtons('admin', 'open', true), []);
  for (const m of ['guest', 'owner', 'admin'] as const) assert.deepEqual(reconButtons(m, 'closed', true), []);
});
