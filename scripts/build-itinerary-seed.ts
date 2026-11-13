/**
 * R5 — Sinh migrations_d1/0014_itinerary_seed.sql từ:
 *  - data/itinerary-sources.json (điểm tham quan, tuyến xe — tra nguồn công khai 14/11/2026)
 *  - scraped-taxua-enriched.json (giá "từ" của homestay/quán trong danh bạ gốc)
 * Mọi bản ghi ở trạng thái 'pending' → admin duyệt mới được dùng. Chạy: npx tsx scripts/build-itinerary-seed.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'data/itinerary-sources.json'), 'utf8'));
const scraped = JSON.parse(fs.readFileSync(path.join(root, 'scraped-taxua-enriched.json'), 'utf8'));
const importSql = fs.readFileSync(path.join(root, 'migrations_d1/0003_import_scraped_listings.sql'), 'utf8');

const q = (v: unknown) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const NOW = `${src.accessed}T00:00:00.000Z`;
const sourcesOf = (keys: string[]) =>
  JSON.stringify(keys.map((k) => {
    const s = src.sources[k];
    if (!s) throw new Error(`Thiếu nguồn ${k}`);
    return { name: s.name, url: s.url, accessed: src.accessed };
  }));

// listing id ↔ đường dẫn gốc trong danh bạ
const idByRef = new Map<string, string>();
for (const m of importSql.matchAll(/VALUES \('([^']+)', '[a-z]+', 'approved', 'scraped', '[^']*', '([^']*)'/g)) idByRef.set(m[2], m[1]);

const lines: string[] = [
  '-- R5 — Dữ liệu tham khảo cho lịch trình (SINH TỰ ĐỘNG bởi scripts/build-itinerary-seed.ts — không sửa tay).',
  `-- Nguồn tra ngày ${src.accessed}. Tất cả ở trạng thái pending: admin duyệt trong Quản trị → "Dữ liệu lịch trình".`,
  '',
];

for (const p of src.places) {
  lines.push(
    `INSERT OR IGNORE INTO places (id, name, kind, area, summary, best_times, styles, visit_minutes, travel_minutes, distance_km, entry_fee_vnd, parking_fee_vnd, difficulty, best_months, notes, cover_image, sources_json, status, created_at, updated_at) VALUES (${[
      p.id, p.name, p.kind, p.area, p.summary, JSON.stringify(p.bestTimes), JSON.stringify(p.styles), p.visitMinutes, p.travelMinutes, p.distanceKm,
      p.entryFeeVnd, p.parkingFeeVnd, p.difficulty, JSON.stringify(p.bestMonths), p.notes, null, sourcesOf(p.sources), 'pending', NOW, NOW,
    ].map(q).join(', ')});`
  );
}
lines.push('');

const fact = (id: string, listingId: string, kind: string, value: unknown, sources: string) =>
  `INSERT OR IGNORE INTO reference_facts (id, listing_id, kind, value_json, sources_json, status, created_at) SELECT ${[id, listingId, kind, JSON.stringify(value), sources, 'pending', NOW].map(q).join(', ')} WHERE EXISTS (SELECT 1 FROM listings WHERE id = ${q(listingId)});`;

for (const b of src.busFacts) {
  lines.push(fact(`rf-bus-${b.listingId}`, b.listingId, 'bus_route', { ...b.value, notes: b.notes }, sourcesOf(b.sources)));
}
lines.push('');

const UNIT: Record<string, string> = { homestays: 'phòng/đêm', restaurants: 'người', cafes: 'người' };
let priced = 0;
for (const cat of Object.keys(UNIT)) {
  for (const x of scraped[cat]) {
    const amount = Number(String(x.priceStr || '').replace(/[^\d]/g, ''));
    const listingId = idByRef.get(x.link);
    if (!amount || !listingId) continue;
    priced++;
    lines.push(
      fact(`rf-price-${listingId}`, listingId, 'price_from', {
        amountVnd: amount,
        unit: UNIT[cat],
        notes: 'Giá "từ" ghi trong danh bạ gốc; danh bạ không ghi đơn vị, đơn vị là suy đoán — admin xác nhận với cơ sở khi duyệt.',
      }, sourcesOf(['scrape']))
    );
  }
}

fs.writeFileSync(path.join(root, 'migrations_d1/0014_itinerary_seed.sql'), lines.join('\n') + '\n');
console.log(`places=${src.places.length} bus=${src.busFacts.length} prices=${priced}`);
