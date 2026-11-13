import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, parsePlanRequest, toMin, type Catalog, type CatalogListing, type CatalogPlace, type PlanRequest } from './engine.ts';

const TODAY = new Date('2026-11-14T03:00:00Z');
const L = (id: string, category: CatalogListing['category'], over: Partial<CatalogListing> = {}): CatalogListing => ({
  id, category, title: `T ${id}`, area: 'Trung Tâm Tà Xùa', phone: '0900000000', zalo: '', coverImage: '', tags: [], hasCloudView: false,
  verificationTier: 1, featured: false, price: null, bus: null, ...over,
});
const P = (id: string, over: Partial<CatalogPlace>): CatalogPlace => ({
  id, name: `Điểm ${id}`, kind: 'viewpoint', area: 'Trung tâm', summary: 's', bestTimes: ['morning'], styles: ['san-may'], visitMinutes: 60,
  travelMinutes: 10, distanceKm: null, entryFeeVnd: null, parkingFeeVnd: null, difficulty: 'de', bestMonths: [], notes: null, coverImage: null, sources: [], ...over,
});
const src = [{ name: 'test', url: null, accessed: '2026-11-14' }];

function catalog(): Catalog {
  return {
    listings: [
      L('hs-cheap', 'homestay', { price: { amountVnd: 350_000, unit: 'phòng/đêm', sources: src } }),
      L('hs-mid', 'homestay', { price: { amountVnd: 900_000, unit: 'phòng/đêm', sources: src } }),
      L('hs-lux', 'homestay', { price: { amountVnd: 2_000_000, unit: 'phòng/đêm', sources: src }, hasCloudView: true }),
      L('hs-noprice', 'homestay'),
      ...['r1', 'r2', 'r3', 'r4'].map((id) => L(id, 'restaurant', id === 'r1' ? { price: { amountVnd: 100_000, unit: 'người', sources: src } } : {})),
      ...['c1', 'c2', 'c3'].map((id) => L(id, 'coffee', { hasCloudView: id === 'c1' })),
      L('bus-night', 'bus', { bus: { outbound: { from: 'Hà Nội', departures: ['06:00', '22:00'], pickup: 'Mỹ Đình' }, inbound: { to: 'Hà Nội', departures: ['12:00', '13:30'] }, durationMinutes: 300, priceFromVnd: 300_000, priceToVnd: null, priceUnit: 'lượt', sources: src } }),
      L('bus-plain', 'bus'),
    ],
    places: [
      P('dinh-gio', { bestTimes: ['sunrise', 'sunset'], travelMinutes: 8, styles: ['san-may', 'chill'] }),
      P('slkl', { bestTimes: ['sunrise'], travelMinutes: 30, visitMinutes: 150, difficulty: 'kho', styles: ['san-may', 'kham-pha'] }),
      P('ca-heo', { bestTimes: ['morning', 'afternoon'], travelMinutes: 30, area: 'Bản Bẹ', styles: ['chup-anh', 'kham-pha'] }),
      P('co-don', { bestTimes: ['morning', 'afternoon'], travelMinutes: 35, area: 'Bản Bẹ', entryFeeVnd: 10_000, parkingFeeVnd: 5000, styles: ['chup-anh'] }),
      P('thao-nguyen', { bestTimes: ['afternoon', 'sunset'], travelMinutes: 40, area: 'Bản Bẹ', entryFeeVnd: 30_000, visitMinutes: 90, styles: ['chill', 'chup-anh'] }),
      P('mam-xoi', { bestTimes: ['morning', 'afternoon'], travelMinutes: 40, bestMonths: [9, 10], styles: ['chup-anh'] }),
      P('che', { bestTimes: ['morning'], travelMinutes: null, styles: ['kham-pha'] }),
    ],
  };
}

const req = (over: Partial<PlanRequest> = {}): PlanRequest => ({
  duration: '3N2D', styles: ['san-may', 'chup-anh'], groupSize: 4, budget: 'vua', startDate: '2026-12-05', transport: 'xe-khach',
  seed: 7, overrides: {}, avoidIds: [], preferIds: [], ...over,
});

test('Kiểm tra đầu vào: chặn ngày đã qua, số người sai, phong cách lạ; giữ overrides hợp lệ', () => {
  const ok = parsePlanRequest({ ...req(), overrides: { 'd1-sunrise': 'slkl', 'BAD KEY': 'x', 'd2-lunch': null } }, TODAY);
  assert.ok(ok.ok);
  if (ok.ok) assert.deepEqual(ok.value.overrides, { 'd1-sunrise': 'slkl', 'd2-lunch': null });
  for (const [bad, field] of [[{ startDate: '2026-11-01' }, 'startDate'], [{ groupSize: 0 }, 'groupSize'], [{ styles: ['nhay-du'] }, 'styles'], [{ duration: '5N4D' }, 'duration'], [{ startDate: '2027-12-30' }, 'startDate']] as const) {
    const r = parsePlanRequest({ ...req(), ...bad }, TODAY);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.field, field);
  }
});

test('Đủ số ngày; giờ trong ngày tăng dần; mỗi điểm chỉ xếp một lần; chỉ dùng id có trong catalog', () => {
  const cat = catalog();
  const ids = new Set([...cat.listings.map((l) => l.id), ...cat.places.map((p) => p.id)]);
  for (const duration of ['2N1D', '3N2D', '4N3D'] as const) {
    const plan = buildPlan(req({ duration }), cat);
    assert.equal(plan.days.length, Number(duration[0]));
    assert.equal(plan.stay.nights, Number(duration[0]) - 1);
    const seen = new Set<string>();
    for (const d of plan.days) {
      const times = d.items.filter((i) => !i.previousNight).map((i) => toMin(i.start));
      assert.deepEqual(times, [...times].sort((a, b) => a - b), `${duration} ngày ${d.index}: ${d.items.map((i) => i.start + ' ' + i.title).join(' | ')}`);
      for (const it of d.items) {
        if (it.ref) assert.ok(ids.has(it.ref.id), it.ref.id);
        for (const a of it.alternatives) assert.ok(ids.has(a), a);
        if (it.kind === 'place') {
          assert.ok(!seen.has(it.ref!.id), `trùng ${it.ref!.id}`);
          seen.add(it.ref!.id);
        }
      }
    }
    assert.ok(!seen.has('che'), 'điểm chưa có thời gian đi không được tự xếp giờ');
    assert.ok(plan.extras.includes('che'));
  }
});

test('Xe đêm: tối hôm trước lên xe 22:00, tới sớm thì săn bình minh điểm gần (≤15 phút); ngày cuối về đúng giờ nhà xe', () => {
  const plan = buildPlan(req({ duration: '2N1D' }), catalog());
  const d1 = plan.days[0].items;
  assert.equal(d1[0].kind, 'transport');
  assert.equal(d1[0].previousNight, true);
  assert.equal(d1[0].start, '22:00');
  assert.equal(d1[0].ref?.id, 'bus-night');
  const sunrise = d1.find((i) => i.slotKey === 'd1-sunrise');
  assert.equal(sunrise?.ref?.id, 'dinh-gio', 'sau xe đêm chỉ chọn điểm gần');
  const last = plan.days[1].items;
  const back = last.find((i) => i.slotKey === 'bus-in');
  assert.ok(back && ['12:00', '13:30'].includes(back.start), 'giờ xe về lấy từ lịch nhà xe');
  const lunch = last.find((i) => i.slotKey === 'd2-lunch');
  assert.ok(lunch && toMin(lunch.start) + 60 <= toMin(back!.start) - 20, 'ăn trưa xong trước giờ xe');
  assert.ok(plan.days[1].items.some((i) => i.slotKey === 'd2-sunrise' && i.ref?.id === 'slkl'), 'sáng ngày 2 săn mây sống lưng khủng long');
});

test('Tự đi: không gắn nhà xe; chi phí ghi phần xăng xe là chưa tính', () => {
  const plan = buildPlan(req({ transport: 'tu-tuc' }), catalog());
  assert.equal(plan.bus.outboundListingId, null);
  assert.ok(!plan.days.flatMap((d) => d.items).some((i) => i.ref?.id.startsWith('bus')));
  assert.ok(plan.cost.unknown.some((u) => /Xăng/.test(u)));
});

test('Ngân sách: chọn homestay có giá trong khung; chi phí = giá phòng × số phòng × số đêm + vé xe 2 chiều + vé tham quan', () => {
  const cheap = buildPlan(req({ budget: 'tiet-kiem' }), catalog());
  assert.equal(cheap.stay.listingId, 'hs-cheap');
  const lux = buildPlan(req({ budget: 'thoai-mai' }), catalog());
  assert.equal(lux.stay.listingId, 'hs-lux');

  const stayLine = cheap.cost.lines.find((l) => l.label.startsWith('Chỗ ở'));
  assert.equal(stayLine?.minVnd, 350_000 * 2 * 2, '4 người → 2 phòng × 2 đêm');
  const busLine = cheap.cost.lines.find((l) => l.label.startsWith('Xe'));
  assert.equal(busLine?.minVnd, 300_000 * 4 * 2);
  const placesWithFee = cheap.days.flatMap((d) => d.items).filter((i) => i.ref?.type === 'place' && ['co-don', 'thao-nguyen'].includes(i.ref.id));
  const feeLine = cheap.cost.lines.find((l) => l.label === 'Vé tham quan');
  const expectedFee = placesWithFee.reduce((s, i) => s + (i.ref!.id === 'co-don' ? 10_000 : 30_000) * 4, 0);
  assert.equal(feeLine?.minVnd ?? 0, expectedFee);
  assert.equal(cheap.cost.totalMinVnd, cheap.cost.lines.reduce((s, l) => s + l.minVnd, 0));
  assert.equal(cheap.cost.perPersonMinVnd, Math.round(cheap.cost.totalMinVnd / 4));
  assert.ok(cheap.cost.unknown.some((u) => /chưa có giá/.test(u)), 'bữa ăn chưa có giá phải được liệt kê, không đoán');
});

test('Đổi một điểm hoặc bỏ điểm giữ nguyên các khung khác; cùng seed cho cùng kết quả', () => {
  const base = buildPlan(req(), catalog());
  assert.deepEqual(buildPlan(req(), catalog()), base, 'tất định');
  const slot = base.days[1].items.find((i) => i.kind === 'place' && i.alternatives.length)!;
  const alt = slot.alternatives[0];
  const swapped = buildPlan(req({ overrides: { [slot.slotKey!]: alt } }), catalog());
  assert.equal(swapped.days[1].items.find((i) => i.slotKey === slot.slotKey)?.ref?.id, alt);
  assert.equal(swapped.stay.listingId, base.stay.listingId);
  assert.deepEqual(swapped.days[0].items.map((i) => i.ref?.id), base.days[0].items.map((i) => i.ref?.id));

  const removed = buildPlan(req({ overrides: { [slot.slotKey!]: null } }), catalog());
  assert.ok(!removed.days[1].items.some((i) => i.slotKey === slot.slotKey));
});

test('Ưu tiên điểm khách muốn đi, bỏ điểm khách muốn tránh; ngoài mùa mây thì có ghi chú', () => {
  const pref = buildPlan(req({ preferIds: ['mam-xoi'], avoidIds: ['slkl'] }), catalog());
  const used = pref.days.flatMap((d) => d.items).map((i) => i.ref?.id);
  assert.ok(used.includes('mam-xoi'));
  assert.ok(!used.includes('slkl'));
  assert.ok(!pref.extras.includes('slkl'));
  const summer = buildPlan(req({ startDate: '2027-06-10' }), catalog());
  assert.ok(summer.notes.some((n) => /ngoài mùa mây/.test(n)));
  assert.ok(!pref.notes.some((n) => /ngoài mùa mây/.test(n)));
});

test('Không có điểm tham quan/nhà xe đã duyệt: vẫn ra lịch ăn ở, ghi rõ phần dữ liệu còn thiếu', () => {
  const cat = catalog();
  const plan = buildPlan(req(), { listings: cat.listings.filter((l) => l.category !== 'bus'), places: [] });
  assert.equal(plan.days.length, 3);
  assert.ok(plan.dataGaps.some((g) => /điểm tham quan/.test(g)));
  assert.ok(plan.dataGaps.some((g) => /giờ chạy xe/.test(g)));
  assert.ok(plan.days[0].items.some((i) => i.kind === 'meal'));
});

test('Vé khứ hồi chưa có giờ về: về cùng nhà xe đó (gọi chốt giờ), không tính thêm vé nhà xe khác', () => {
  const cat = catalog();
  const rt = L('bus-rt', 'bus', { bus: { outbound: { from: 'Hà Nội', departures: ['22:00'], pickup: null }, inbound: null, durationMinutes: 300, priceFromVnd: 700_000, priceToVnd: null, priceUnit: 'khứ hồi', sources: src } });
  const other = L('bus-back', 'bus', { bus: { outbound: null, inbound: { to: 'Hà Nội', departures: ['08:00'] }, durationMinutes: null, priceFromVnd: null, priceToVnd: null, priceUnit: null, sources: src } });
  const plan = buildPlan(req({ duration: '2N1D' }), { ...cat, listings: [...cat.listings.filter((l) => l.category !== 'bus'), rt, other] });
  assert.equal(plan.bus.outboundListingId, 'bus-rt');
  assert.equal(plan.bus.inboundListingId, null);
  const back = plan.days[1].items.find((i) => i.kind === 'transport');
  assert.equal(back?.ref?.id, 'bus-rt');
  const busLines = plan.cost.lines.filter((l) => l.label.startsWith('Xe'));
  assert.deepEqual(busLines.map((l) => l.minVnd), [700_000 * 4]);
  assert.ok(!plan.cost.unknown.some((u) => /bus-back/.test(u)));
});

test('Sau xe đêm đã có giờ nghỉ bù thì không thêm nghỉ trưa ngày đầu', () => {
  const plan = buildPlan(req({ duration: '2N1D' }), catalog());
  assert.equal(plan.days[0].items.filter((i) => i.kind === 'rest').length, 1);
});
