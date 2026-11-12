import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayInVietnam, addDays, defaultStayDates, normalizeSearchIntent, nightsBetween, quickDatePresets } from './searchIntent.ts';
import { captureAttribution } from './attribution.ts';

// 2026-11-12 18:30 UTC = 2026-11-13 01:30 giờ Việt Nam
const NOW = new Date('2026-11-12T18:30:00Z');

test('Ngày hôm nay tính theo giờ Việt Nam, không theo UTC', () => {
  assert.equal(todayInVietnam(NOW), '2026-11-13');
  assert.equal(todayInVietnam(new Date('2026-11-12T16:59:00Z')), '2026-11-12');
});

test('Cộng ngày qua cuối tháng/năm', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(nightsBetween('2026-11-20', '2026-11-22'), 2);
});

test('Ngày mặc định: nhận phòng ngày mai, ở 1 đêm — không còn ngày cố định 2026-11-06', () => {
  assert.deepEqual(defaultStayDates(NOW), { checkIn: '2026-11-14', checkOut: '2026-11-15' });
});

test('Chuẩn hóa: giữ lựa chọn hợp lệ', () => {
  const i = normalizeSearchIntent({ checkIn: '2026-11-20', checkOut: '2026-11-22', adults: 4, children: 1, rooms: 2, area: 'Đỉnh Gió' }, NOW);
  assert.deepEqual(i, { checkIn: '2026-11-20', checkOut: '2026-11-22', adults: 4, children: 1, rooms: 2, area: 'Đỉnh Gió' });
});

test('Chuẩn hóa: ngày quá khứ/sai định dạng → mặc định; trả phòng không sau nhận phòng → +1 đêm', () => {
  assert.equal(normalizeSearchIntent({ checkIn: '2026-11-06', checkOut: '2026-11-08' }, NOW).checkIn, '2026-11-14');
  assert.equal(normalizeSearchIntent({ checkIn: '20/11/2026' }, NOW).checkIn, '2026-11-14');
  assert.equal(normalizeSearchIntent({ checkIn: '2026-02-30' }, NOW).checkIn, '2026-11-14');
  const same = normalizeSearchIntent({ checkIn: '2026-11-20', checkOut: '2026-11-20' }, NOW);
  assert.equal(same.checkOut, '2026-11-21');
  const tooLong = normalizeSearchIntent({ checkIn: '2026-11-20', checkOut: '2027-01-20' }, NOW);
  assert.equal(nightsBetween(tooLong.checkIn, tooLong.checkOut), 30, 'tối đa 30 đêm');
});

test('Chuẩn hóa: số khách/phòng là số nguyên trong giới hạn', () => {
  const i = normalizeSearchIntent({ adults: 0, children: -2, rooms: 99 }, NOW);
  assert.equal(i.adults, 1);
  assert.equal(i.children, 0);
  assert.equal(i.rooms, 10);
  const n = normalizeSearchIntent({ adults: Number('abc'), rooms: 1.7 as any }, NOW);
  assert.equal(n.adults, 2);
  assert.equal(n.rooms, 1);
});

test('Nguồn khách (UTM): ghi lần chạm đầu, không ghi đè', () => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  const first = captureAttribution('?utm_source=facebook&utm_campaign=san-may&checkin=2026-11-20', 'https://google.com/', storage, NOW);
  assert.equal(first?.utm_source, 'facebook');
  assert.equal(first?.utm_campaign, 'san-may');
  assert.equal(first?.referrer, 'https://google.com/');
  assert.equal(first?.landedAt, NOW.toISOString());
  const second = captureAttribution('?utm_source=zalo', '', storage, NOW);
  assert.equal(second?.utm_source, 'facebook', 'giữ nguồn đầu tiên');
  assert.equal(captureAttribution('?checkin=2026-11-20', '', { getItem: () => null, setItem: () => {} }, NOW), null, 'không có UTM thì không ghi');
});

test('Nút chọn nhanh ngày tính từ hôm nay: ngày mai, cuối tuần này, cuối tuần sau', () => {
  // 13/11/2026 là thứ Sáu theo giờ VN
  const p = quickDatePresets(NOW);
  assert.deepEqual(p.map((x) => [x.inDate, x.outDate]), [
    ['2026-11-14', '2026-11-15'],
    ['2026-11-20', '2026-11-22'],
    ['2026-11-27', '2026-11-29'],
  ]);
  assert.equal(p[1].label, 'T6 20/11 → CN 22/11');
  // Thứ Hai 16/11: cuối tuần này là 20–22/11
  const mon = quickDatePresets(new Date('2026-11-16T03:00:00Z'));
  assert.deepEqual([mon[1].inDate, mon[1].outDate], ['2026-11-20', '2026-11-22']);
});
