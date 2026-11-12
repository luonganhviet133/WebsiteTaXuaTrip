import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nightLabel } from './quotesApi.ts';

test('Nhãn đêm hiển thị thứ, ngày và loại giá', () => {
  assert.equal(nightLabel({ date: '2026-11-20', kind: 'weekend', pricePerRoom: 1 }), 'T6 20/11 · cuối tuần');
  assert.equal(nightLabel({ date: '2026-11-16', kind: 'weekday', pricePerRoom: 1 }), 'T2 16/11 · ngày thường');
  assert.equal(nightLabel({ date: '2026-12-31', kind: 'holiday', pricePerRoom: 1 }), 'T5 31/12 · ngày lễ');
});
