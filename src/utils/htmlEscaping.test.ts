/**
 * G0.5 — Dữ liệu chứa thẻ HTML phải hiện như chữ trong tooltip bản đồ và file lịch trình tải về.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escapeHtml.ts';
import { buildLandmarkTooltipHtml, buildListingTooltipHtml } from './mapTooltipHtml.ts';
import { buildOfflineStepHtml, buildOfflineDayHtml } from './offlineItineraryHtml.ts';

const PAYLOAD = '<img src=x onerror="alert(1)">';
const ESCAPED = '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;';

function assertNoInjectedTag(html: string) {
  assert.ok(!html.includes('<img'), `HTML còn thẻ <img> chưa escape:\n${html}`);
  assert.ok(html.includes(ESCAPED), 'Nội dung độc hại phải còn nguyên dưới dạng chữ đã escape');
}

test('escapeHtml escape đủ & < > " \' và giữ nguyên tiếng Việt', () => {
  assert.equal(escapeHtml(`Tà Xùa & "Mây" <b>'x'</b>`), 'Tà Xùa &amp; &quot;Mây&quot; &lt;b&gt;&#39;x&#39;&lt;/b&gt;');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(1700), '1700');
});

test('Tooltip địa danh: tên, độ cao, khung giờ chứa HTML hiện như chữ', () => {
  const html = buildLandmarkTooltipHtml({ name: PAYLOAD, altitude: PAYLOAD, cloudProbability: 90, bestTime: PAYLOAD });
  assertNoInjectedTag(html);
});

test('Tooltip cơ sở: tên, khu vực, địa danh tham chiếu chứa HTML hiện như chữ', () => {
  const html = buildListingTooltipHtml(
    { title: PAYLOAD, area: PAYLOAD, rating: 4.8, reviewCount: 12, hasCloudView: true, minPrice: 500000 },
    '🏡',
    { km: 2.5, area: PAYLOAD }
  );
  assertNoInjectedTag(html);
  assert.ok(html.includes('View biển mây'), 'Phần HTML do code tạo vẫn giữ nguyên');
});

test('File lịch trình tải về: từng trường của bước và cơ sở hiện như chữ', () => {
  const html = buildOfflineStepHtml(
    { time: PAYLOAD, title: PAYLOAD, location: PAYLOAD, activity: PAYLOAD, tip: PAYLOAD },
    { title: PAYLOAD, area: PAYLOAD, phone: PAYLOAD },
    350000
  );
  assertNoInjectedTag(html);
  assert.ok(html.includes('<strong>350.000'), 'Số tiền do code định dạng vẫn hiển thị');
});

test('File lịch trình tải về: tiêu đề ngày hiện như chữ, phần bước đã dựng sẵn giữ nguyên', () => {
  const html = buildOfflineDayHtml(PAYLOAD, '<div>bước</div>');
  assertNoInjectedTag(html);
  assert.ok(html.endsWith('<div>bước</div>'));
});
