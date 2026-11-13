import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INITIAL_SITE_CONTENT, INITIAL_USER_PROFILE } from './mockData.ts';

/** R4: nội dung mặc định hiển thị cho khách thật không được có tuyên bố/số liệu chưa kiểm chứng. */
test('Nội dung mặc định nói thật: không % (trừ cọc 30%), không "hôm nay", không "100%"/"24/7", hồ sơ khách trống', () => {
  const visible = JSON.stringify({ ...INITIAL_SITE_CONTENT, curatedCombos: [], socialChannels: [] });
  const percents = [...visible.matchAll(/\d+\s?%/g)].map((m) => m[0]).filter((p) => p.replace(/\s/g, '') !== '30%');
  assert.deepEqual(percents, []);
  assert.ok(!/hôm nay/i.test(visible), 'không dùng "hôm nay" cho nội dung cố định');
  assert.ok(!/24\/7|179\+|thời gian thực/i.test(visible));
  assert.deepEqual(INITIAL_USER_PROFILE.savedListings, []);
  assert.deepEqual(INITIAL_USER_PROFILE.bookingHistory, []);
});

test('Trang Thẩm định không có danh sách lừa đảo bịa; không còn số liệu cố định 185/1.240/Online', () => {
  const ver = fs.readFileSync(new URL('../components/VerificationMethodologySection.tsx', import.meta.url), 'utf8');
  assert.match(ver, /const SAMPLE_BLACKLIST: BlacklistCase\[\] = \[\];/);
  const app = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  for (const lit of ['>\n              185\n', 'verifiedMembersCount={1240}']) assert.ok(!app.includes(lit), lit);
  for (const m of app.matchAll(/\((\d+) Online\)/g)) {
    // chỉ còn trong khối bị khóa bởi featureOpen('communityChat')
    const before = app.slice(Math.max(0, m.index! - 600), m.index!);
    assert.ok(before.includes("featureOpen('communityChat')"), `số Online lộ ra ngoài khối khóa: ${m[0]}`);
  }
});
