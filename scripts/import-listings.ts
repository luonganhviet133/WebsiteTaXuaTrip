/**
 * N03.1 — Sinh file migration D1 từ dữ liệu thu thập công khai.
 *   npx tsx scripts/import-listings.ts [--collected-at 2026-11-04] [--out migrations_d1/0003_import_scraped_listings.sql]
 * Không sửa mã TypeScript. Báo lỗi ID/trùng và dừng (exit 1) nếu có lỗi.
 */
import fs from 'node:fs';
import { buildImportPlan, renderSql, type ScrapedRecord } from '../src/server/listings/importer.ts';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

// Ngày sinh bộ dữ liệu theo scripts/build-mockdata.js (updatedCalendarDate của các cơ sở thu thập).
const collectedAt = arg('collected-at', '2026-11-04');
const out = arg('out', 'migrations_d1/0003_import_scraped_listings.sql');
const sourceName = 'Danh bạ Tà Xùa thu thập công khai (scraped-taxua-enriched.json)';

const enriched: Record<string, ScrapedRecord[]> = JSON.parse(fs.readFileSync('scraped-taxua-enriched.json', 'utf8'));
const existing: Array<{ id: string; title: string; category: string }> = JSON.parse(fs.readFileSync('all-listings.json', 'utf8'));
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').trim();

// ID cũ (tx-…) do scripts/build-mockdata.js đánh số theo đúng thứ tự từng nhóm trong file nguồn.
// Ghép theo thứ tự trong cùng loại và bắt buộc tên khớp, lệch là dừng.
const existingIds: Record<string, string> = {};
const mismatches: string[] = [];
for (const group of Object.values(enriched)) {
  const category = group[0]?.category;
  const generated = existing.filter((l) => l.category === category && l.id.startsWith('tx-'));
  if (!generated.length) continue;
  group.forEach((rec, i) => {
    const old = generated[i];
    if (!old) return;
    if (!decode(old.title).includes(decode(rec.name))) {
      mismatches.push(`${category} #${i}: "${rec.name}" ≠ "${old.title}" (${old.id})`);
      return;
    }
    existingIds[`${rec.category}|${rec.link || ''}`] = old.id;
  });
}
if (mismatches.length) {
  console.error('Không ghép được ID cũ:');
  mismatches.forEach((m) => console.error(`  ! ${m}`));
  process.exit(1);
}

const plan = buildImportPlan(Object.values(enriched).flat(), { existingIds, collectedAt, sourceName });
console.log(`Giữ ID cũ: ${Object.keys(existingIds).length}`);

console.log(`Cơ sở hợp lệ: ${plan.listings.length}`);
console.log(`Bỏ qua: ${plan.skipped.length}`);
plan.skipped.forEach((s) => console.log(`  - ${s}`));
if (plan.errors.length) {
  console.error(`Lỗi: ${plan.errors.length}`);
  plan.errors.forEach((e) => console.error(`  ! ${e}`));
  process.exit(1);
}

const header = `-- Migration 0003 (N03.1): ${plan.listings.length} cơ sở từ nguồn thu thập công khai, sinh bởi scripts/import-listings.ts.
-- Đều ở Cấp 1 (chưa xác minh), không có tọa độ, điểm sao, hạng phòng hay huy hiệu tự sinh.
-- INSERT OR IGNORE: chạy lại không tạo trùng và không đè bản đã sửa. Không sửa tay file này.
`;
fs.writeFileSync(out, header + renderSql(plan));
console.log(`Đã ghi ${out}`);
