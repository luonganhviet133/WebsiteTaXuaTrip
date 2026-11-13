import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURES, featureForApi, isOpen } from './features.ts';

test('Cờ tính năng: mỗi tính năng có tên và câu thay thế; API AI và cổng Revid thuộc tính năng của nó', () => {
  for (const [k, f] of Object.entries(FEATURES)) {
    assert.ok(f.title.length >= 3, k);
    assert.ok(f.note.length >= 20 && !/\d{2,}\s*(người|khách|thành viên)/.test(f.note), `${k}: câu ghi chú không được chứa số liệu người dùng`);
  }
  assert.equal(featureForApi('POST', '/api/ai/consult'), 'aiAdvisor');
  assert.equal(featureForApi('POST', '/api/ai/quick-quote'), 'aiAdvisor');
  assert.equal(featureForApi('POST', '/api/revid/playground-chat'), 'aiGateway');
  assert.equal(featureForApi('GET', '/api/listings'), null);
  assert.equal(isOpen('aiAdvisor'), false);
});
