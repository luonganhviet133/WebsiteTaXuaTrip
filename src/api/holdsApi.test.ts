import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayBookingStatus, holdErrorAction, holdExpiryLabel, newIdempotencyKey } from './holdsApi.ts';

test('Khóa idempotency ngẫu nhiên, hợp lệ với server (chữ, số, _, -; tối đa 80)', () => {
  const a = newIdempotencyKey();
  const b = newIdempotencyKey();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{1,80}$/);
});

test('Lỗi giữ chỗ dẫn tới đúng hành động giao diện', () => {
  assert.equal(holdErrorAction(401, 'UNAUTHORIZED'), 'login');
  assert.equal(holdErrorAction(0, 'NETWORK'), 'retry_same_key');
  assert.equal(holdErrorAction(503, 'HTTP_503'), 'retry_same_key');
  assert.equal(holdErrorAction(409, 'SOLD_OUT'), 'refresh_quote');
  assert.equal(holdErrorAction(409, 'QUOTE_EXPIRED'), 'refresh_quote');
  assert.equal(holdErrorAction(409, 'LISTING_CHANGED'), 'refresh_quote');
  assert.equal(holdErrorAction(400, 'INVALID_PHONE'), 'show');
});

test('Giờ hết hạn hiển thị theo giờ Việt Nam', () => {
  assert.equal(holdExpiryLabel('2026-11-13T07:35:00.000Z'), '14:35 ngày 13/11');
  assert.equal(holdExpiryLabel('2026-11-13T17:10:00.000Z'), '00:10 ngày 14/11');
});

test('Trạng thái hiển thị: giữ chỗ còn hạn là chờ cọc, quá hạn là hết hạn dù cron chưa dọn', () => {
  const now = Date.parse('2026-11-13T07:00:00Z');
  assert.equal(displayBookingStatus('pending_deposit', '2026-11-13T07:10:00Z', now), 'pending');
  assert.equal(displayBookingStatus('pending_deposit', '2026-11-13T06:59:00Z', now), 'expired');
  assert.equal(displayBookingStatus('expired', null, now), 'expired');
  assert.equal(displayBookingStatus('confirmed', null, now), 'confirmed');
});
