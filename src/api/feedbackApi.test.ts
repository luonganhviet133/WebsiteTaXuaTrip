import { test } from 'node:test';
import assert from 'node:assert/strict';
import { complaintButtons } from './feedbackApi.ts';

test('Nút khiếu nại theo vai trò phản chiếu bảng luật server (server vẫn quyết định cuối)', () => {
  assert.deepEqual(complaintButtons('guest', 'open', false), ['withdraw']);
  assert.deepEqual(complaintButtons('owner', 'open', false), ['respond']);
  assert.deepEqual(complaintButtons('admin', 'open', false), ['assign']);
  assert.deepEqual(complaintButtons('admin', 'in_review', false), ['conclude']);
  assert.deepEqual(complaintButtons('guest', 'refund_pending', false), [], 'chưa quá hạn thì chờ cơ sở');
  assert.deepEqual(complaintButtons('guest', 'refund_pending', true), ['refund_not_received']);
  assert.deepEqual(complaintButtons('owner', 'refund_pending', false), ['report_refund']);
  assert.deepEqual(complaintButtons('guest', 'refund_reported', false), ['confirm_refund', 'refund_not_received']);
  assert.deepEqual(complaintButtons('admin', 'refund_reported', false), [], 'admin không xác nhận thay khách');
  assert.deepEqual(complaintButtons('admin', 'refund_disputed', false), ['admin_confirm_refund', 'require_refund']);
  for (const m of ['guest', 'owner', 'admin'] as const) assert.deepEqual(complaintButtons(m, 'closed', false), []);
});
