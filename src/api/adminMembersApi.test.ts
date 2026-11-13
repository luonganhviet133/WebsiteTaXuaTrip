import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memberQuery } from './adminMembersApi.ts';

test('memberQuery: bỏ ô trống, bỏ trang 1, mã hóa tìm kiếm', () => {
  assert.equal(memberQuery({}), '');
  assert.equal(memberQuery({ q: '  ', page: 1 }), '');
  assert.equal(memberQuery({ q: 'Mây Tà Xùa', role: 'partner', verification: 'pending', page: 3 }), '?q=M%C3%A2y+T%C3%A0+X%C3%B9a&role=partner&verification=pending&page=3');
});
