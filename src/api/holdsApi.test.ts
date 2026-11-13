import { test } from 'node:test';
import assert from 'node:assert/strict';
import { holdErrorAction, holdExpiryLabel, newIdempotencyKey } from './holdsApi.ts';

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
