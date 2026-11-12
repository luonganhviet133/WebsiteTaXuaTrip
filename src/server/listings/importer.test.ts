import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseEngine } from '../db.ts';
import { isValidListingId, slugifyVi, splitVnPhones, validateListingContent, areaFromAddress } from './content.ts';
import { buildImportPlan, renderSql, type ScrapedRecord } from './importer.ts';

const COLLECTED_AT = '2026-11-04';

const sample = (over: Partial<ScrapedRecord> = {}): ScrapedRecord => ({
  category: 'homestay',
  name: 'Chillout Village Tà Xùa',
  link: '/homestay/chillout-village-ta-xua',
  img: 'https://img.example/a.webp',
  images: ['https://img.example/a.webp', 'https://img.example/b.webp'],
  address: 'Khe Cải, Tà Xùa, Bắc Yên, Sơn La',
  priceStr: '400.000đ',
  tags: ['View săn mây'],
  badge: 'Nổi bật',
  phone: '0933669881',
  zalo: '0933669881',
  facebook: 'https://www.facebook.com/groups/taxua',
  description: 'Mô tả thật từ nguồn.',
  ...over,
});

test('ID: chỉ chữ thường không dấu, số, gạch ngang; slug tiếng Việt', () => {
  assert.equal(isValidListingId('tx-stay-5'), true);
  assert.equal(isValidListingId('homestay-may'), true);
  assert.equal(isValidListingId('Tx_Stay'), false);
  assert.equal(isValidListingId('-abc'), false);
  assert.equal(isValidListingId('a'), false);
  assert.equal(isValidListingId('x'.repeat(81)), false);
  assert.equal(slugifyVi('Đỉnh Gió Homestay & Cà Phê!'), 'dinh-gio-homestay-ca-phe');
});

test('Số điện thoại: tách số dính liền, đổi +84, bỏ số sai', () => {
  assert.deepEqual(splitVnPhones('08659636470812251575'), ['0865963647', '0812251575']);
  assert.deepEqual(splitVnPhones('0981 234 567'), ['0981234567']);
  assert.deepEqual(splitVnPhones('+84 981234567'), ['0981234567']);
  assert.deepEqual(splitVnPhones('1900 8899'), []);
  assert.deepEqual(splitVnPhones(''), []);
});

test('Khu vực suy từ địa chỉ', () => {
  assert.equal(areaFromAddress('Khe Cải, Tà Xùa'), 'Khe Cải');
  assert.equal(areaFromAddress('gần Sống Lưng Khủng Long'), 'Sống Lưng Khủng Long');
  assert.equal(areaFromAddress('Bản Chung Trinh, Xã Tà Xùa'), 'Trung Tâm Tà Xùa');
});

test('validateListingContent: bỏ trường lạ, báo lỗi trường sai', () => {
  const ok = validateListingContent({
    title: '  Nhà A  ', category: 'homestay', area: 'Khe Cải', minPrice: 400000,
    rating: 5, verificationTier: 3, status: 'approved', coordinates: null,
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.content.title, 'Nhà A');
    assert.equal((ok.content as any).rating, undefined, 'điểm sao không do người sửa tự khai');
    assert.equal((ok.content as any).verificationTier, undefined, 'huy hiệu không nằm trong nội dung sửa được');
    assert.equal((ok.content as any).status, undefined);
  }

  const bad = validateListingContent({ title: '', category: 'spaceship', area: 'Mặt trăng', minPrice: -1, coordinates: { lat: 99, lng: 0 }, images: ['javascript:alert(1)'] });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    for (const field of ['title', 'category', 'area', 'minPrice', 'coordinates', 'images']) {
      assert.ok(bad.errors.some((e) => e.field === field), `thiếu lỗi cho ${field}`);
    }
  }
});

test('Importer: không tự sinh đánh giá, tọa độ, huy hiệu, phòng; ghi nguồn và ngày thu thập', () => {
  const plan = buildImportPlan([sample()], { existingIds: {}, collectedAt: COLLECTED_AT, sourceName: 'nguồn thử' });
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.listings.length, 1);
  const [item] = plan.listings;
  assert.equal(item.id, 'homestay-chillout-village-ta-xua');
  assert.equal(item.verificationTier, 1);
  assert.equal(item.dataOrigin, 'scraped');
  assert.equal(item.sourceRef, '/homestay/chillout-village-ta-xua');
  assert.equal(item.collectedAt, COLLECTED_AT);
  assert.equal(item.content.coordinates, null);
  assert.equal(item.content.roomTypes, undefined);
  assert.equal(item.content.menuItems, undefined);
  assert.equal(item.content.minPrice, 400000);
  assert.equal(item.content.phone, '0933669881');
  assert.equal(item.content.facebook, undefined, 'link nhóm Facebook chung không phải trang của cơ sở');
  assert.equal(item.content.isInstantBooking, false);
});

test('Importer: giữ ID cũ theo loại + link, báo ID trùng và ID sai', () => {
  const plan = buildImportPlan(
    [sample(), sample({ name: 'Nhà B', link: '/homestay/nha-b' }), sample({ name: 'Nhà C', link: '/homestay/nha-c' })],
    { existingIds: { 'homestay|/homestay/chillout-village-ta-xua': 'tx-stay-1', 'homestay|/homestay/nha-b': 'tx-stay-1', 'homestay|/homestay/nha-c': 'Sai_ID' }, collectedAt: COLLECTED_AT, sourceName: 'x' }
  );
  assert.equal(plan.listings.length, 1);
  assert.equal(plan.listings[0].id, 'tx-stay-1');
  assert.ok(plan.errors.some((e) => e.includes('trùng') && e.includes('tx-stay-1')));
  assert.ok(plan.errors.some((e) => e.includes('Sai_ID')));
});

test('Importer: hai mục cùng tên khác loại là hai cơ sở riêng', () => {
  const plan = buildImportPlan(
    [sample({ category: 'homestay', link: '/homestay/tram-may' , name: 'Trạm Mây' }), sample({ category: 'coffee', link: '/cafe/tram-may', name: 'Trạm Mây' })],
    { existingIds: {}, collectedAt: COLLECTED_AT, sourceName: 'x' }
  );
  assert.deepEqual(plan.errors, [], 'hai link khác nhau → hai ID khác nhau');
  assert.deepEqual(plan.listings.map((l) => l.id), ['homestay-tram-may', 'cafe-tram-may']);
});

test('Importer: bỏ loại không phải cơ sở (điểm check-in)', () => {
  const plan = buildImportPlan([sample({ category: 'checkin', name: 'Cây cô đơn' })], { existingIds: {}, collectedAt: COLLECTED_AT, sourceName: 'x' });
  assert.equal(plan.listings.length, 0);
  assert.equal(plan.skipped.length, 1);
});

test('Importer: chạy SQL hai lần không tạo trùng, không ghi đè bản đã sửa', async () => {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.resetDatabaseForTest();
  const plan = buildImportPlan([sample()], { existingIds: {}, collectedAt: COLLECTED_AT, sourceName: 'x' });
  const sql = renderSql(plan);
  await db.d1.exec(sql);
  await db.d1.exec(sql);
  const count = await db.d1.prepare('SELECT COUNT(*) AS n FROM listings').first<{ n: number }>();
  const versions = await db.d1.prepare('SELECT COUNT(*) AS n FROM listing_versions').first<{ n: number }>();
  assert.equal(count?.n, 1);
  assert.equal(versions?.n, 1);

  await db.d1.prepare("UPDATE listing_versions SET content_json = '{\"title\":\"Đã sửa\"}'").run();
  await db.d1.exec(sql);
  const row = await db.d1.prepare('SELECT content_json AS c FROM listing_versions').first<{ c: string }>();
  assert.equal(JSON.parse(row!.c).title, 'Đã sửa');
});

test('Migration dữ liệu đã sinh khớp importer: 172 cơ sở, đều Cấp 1, không có tọa độ', async () => {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  const stats = await db.d1
    .prepare(`SELECT COUNT(*) AS n, MAX(verification_tier) AS maxTier, SUM(status = 'approved') AS approved FROM listings WHERE data_origin = 'scraped'`)
    .first<{ n: number; maxTier: number; approved: number }>();
  assert.equal(stats?.n, 172);
  assert.equal(stats?.maxTier, 1);
  assert.equal(stats?.approved, 172);
  const withCoords = await db.d1
    .prepare(`SELECT COUNT(*) AS n FROM listing_versions WHERE json_extract(content_json, '$.coordinates') IS NOT NULL`)
    .first<{ n: number }>();
  assert.equal(withCoords?.n, 0);
  const demo = await db.d1.prepare(`SELECT COUNT(*) AS n FROM listings WHERE id IN ('homestay-may','tx-rescue-1')`).first<{ n: number }>();
  assert.equal(demo?.n, 0, 'cơ sở tự bịa không vào dữ liệu thật');
  const sql = readFileSync('migrations_d1/0003_import_scraped_listings.sql', 'utf8');
  assert.match(sql, /INSERT OR IGNORE INTO listings/);
});
