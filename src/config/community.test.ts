import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POINT_RULES, TITLES, REDEMPTION_ENABLED, POINTS_WINDOW_DAYS, shortName, titleFor, feeFor, vnMonth, previousVnMonth,
  PERIOD_RE, periodKind, periodRange, currentPeriod, previousPeriod, periodLabel,
} from './community.ts';

test('Điểm Mây theo đóng góp (chủ dự án chốt 13/11/2026), không theo tiền', () => {
  assert.equal(POINT_RULES.stay_completed, 20);
  assert.equal(POINT_RULES.review, 30);
  assert.equal(POINT_RULES.review_photo, 20);
  assert.equal(POINT_RULES.admin_award_max, 500);
  assert.equal(POINTS_WINDOW_DAYS, 365, 'D05: hết hạn sau 12 tháng');
  assert.equal(REDEMPTION_ENABLED, false, 'đổi quà khóa tới khi chốt giá trị điểm và ai chịu');
});

test('Danh hiệu theo điểm 12 tháng gần nhất; có mốc tiếp theo', () => {
  assert.deepEqual(TITLES.map((t) => [t.min, t.name]), [
    [0, 'Lữ khách mới'],
    [100, 'Người săn mây'],
    [300, 'Thổ địa Tà Xùa'],
    [800, 'Đại sứ Tà Xùa'],
  ]);
  assert.deepEqual(titleFor(0), { name: 'Lữ khách mới', next: { name: 'Người săn mây', min: 100 } });
  assert.deepEqual(titleFor(99), { name: 'Lữ khách mới', next: { name: 'Người săn mây', min: 100 } });
  assert.deepEqual(titleFor(300), { name: 'Thổ địa Tà Xùa', next: { name: 'Đại sứ Tà Xùa', min: 800 } });
  assert.deepEqual(titleFor(5000), { name: 'Đại sứ Tà Xùa', next: null });
  assert.equal(titleFor(-20).name, 'Lữ khách mới', 'bị thu hồi xuống âm vẫn là mức đầu');
});

test('Tên rút gọn trên bảng xếp hạng: giữ họ, các chữ sau viết tắt', () => {
  assert.equal(shortName('Nguyễn Văn Khách'), 'Nguyễn V. K.');
  assert.equal(shortName('  trần   thị  mây '), 'Trần T. M.');
  assert.equal(shortName('Lan'), 'Lan');
  assert.equal(shortName(''), 'Thành viên');
  assert.equal(shortName('0912345678'), 'Thành viên', 'không lộ số điện thoại nếu tên là số');
  assert.equal(shortName('khach@gmail.com'), 'Thành viên', 'không lộ email');
});

test('Phí nền tảng theo mức của từng cơ sở: cố định mỗi đơn hoặc % tổng đơn (làm tròn tới đồng)', () => {
  assert.equal(feeFor({ mode: 'fixed', value: 50000 }, 1_300_000), 50000);
  assert.equal(feeFor({ mode: 'percent_bp', value: 500 }, 1_300_000), 65000, '5% = 500 điểm cơ bản');
  assert.equal(feeFor({ mode: 'percent_bp', value: 250 }, 1_000_010), 25000, '2,5% của 1.000.010 = 25.000,25 → 25.000');
  assert.equal(feeFor({ mode: 'percent_bp', value: 250 }, 1_000_020), 25001, '25.000,5 → 25.001 (làm tròn thông thường)');
  assert.equal(feeFor(null, 1_000_000), 0, 'chưa cài mức phí thì không ghi phí');
});

test('Tháng theo giờ Việt Nam', () => {
  assert.equal(vnMonth(new Date('2026-11-30T16:59:00Z')), '2026-11');
  assert.equal(vnMonth(new Date('2026-11-30T17:00:00Z')), '2026-12');
  assert.equal(previousVnMonth(new Date('2026-01-10T00:00:00Z')), '2025-12');
});

test('Giao diện không tự cộng/trừ Điểm Mây trong trình duyệt và không còn phí cố định 50.000đ', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = [path.join(root, 'App.tsx'), ...fs.readdirSync(path.join(root, 'components')).filter((f) => f.endsWith('.tsx')).map((f) => path.join(root, 'components', f))];
  const offenders: string[] = [];
  for (const f of files) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (/cloudPoints:\s*prev\.cloudPoints\s*[+-]|onEarnCloudPoints|calculateMemberPoints|calculatePlatformFee|\+\s*\{?(pointsEarned|earnedPoints)\}?\s*Điểm Mây|\+\d+ Điểm Mây|\+\d+đ\)|50\.000đ\/booking|50k\/booking|Phí Sàn 50\.000đ|trừ 50\.000đ/.test(line)) {
        offenders.push(`${path.basename(f)}:${i + 1}: ${line.trim().slice(0, 90)}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});

test('Kỳ trao quà top 3: tháng / quý / năm theo giờ Việt Nam (chủ dự án chốt 13/11/2026)', () => {
  for (const ok of ['2026-11', '2026-Q4', '2026']) assert.ok(PERIOD_RE.test(ok), ok);
  for (const bad of ['2026-13', '2026-Q5', '26', '2026-1', 'x']) assert.ok(!PERIOD_RE.test(bad), bad);
  assert.equal(periodKind('2026-11'), 'month');
  assert.equal(periodKind('2026-Q4'), 'quarter');
  assert.equal(periodKind('2026'), 'year');
  assert.deepEqual(periodRange('2026-11'), ['2026-10-31T17:00:00.000Z', '2026-11-30T17:00:00.000Z']);
  assert.deepEqual(periodRange('2026-Q4'), ['2026-09-30T17:00:00.000Z', '2026-12-31T17:00:00.000Z']);
  assert.deepEqual(periodRange('2026-Q1'), ['2025-12-31T17:00:00.000Z', '2026-03-31T17:00:00.000Z']);
  assert.deepEqual(periodRange('2026'), ['2025-12-31T17:00:00.000Z', '2026-12-31T17:00:00.000Z']);
  const now = new Date('2026-01-10T03:00:00Z');
  assert.equal(currentPeriod('quarter', now), '2026-Q1');
  assert.equal(previousPeriod('month', now), '2025-12');
  assert.equal(previousPeriod('quarter', now), '2025-Q4');
  assert.equal(previousPeriod('year', now), '2025');
  // 31/12 lúc 18:00 UTC đã là 01/01 giờ VN
  assert.equal(currentPeriod('year', new Date('2026-12-31T18:00:00Z')), '2027');
  assert.equal(periodLabel('2026-11'), 'tháng 11/2026');
  assert.equal(periodLabel('2026-Q4'), 'quý 4/2026');
  assert.equal(periodLabel('2026'), 'năm 2026');
});
