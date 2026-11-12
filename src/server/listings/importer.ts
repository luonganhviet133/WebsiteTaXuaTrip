/**
 * N03.1 — Nhập danh bạ thu thập công khai thành dữ liệu D1 (không ghi đè mã TypeScript).
 * Kết quả là SQL chỉ chèn khi chưa có (INSERT OR IGNORE): chạy lại không tạo trùng
 * và không đè lên bản chủ cơ sở/admin đã sửa.
 * Không tự sinh điểm sao, số đánh giá, tọa độ, huy hiệu, hạng phòng, menu hay số liệu thống kê.
 */
import type { ServiceCategory } from '../../types/index.ts';
import {
  LISTING_CATEGORIES,
  areaFromAddress,
  isValidListingId,
  slugifyVi,
  splitVnPhones,
  validateListingContent,
  type ListingContent,
} from './content.ts';

export interface ScrapedRecord {
  category: string;
  name: string;
  link?: string;
  img?: string;
  images?: string[];
  address?: string;
  priceStr?: string;
  tags?: string[];
  badge?: string;
  phone?: string;
  zalo?: string;
  facebook?: string;
  description?: string;
}

export interface ImportedListing {
  id: string;
  category: ServiceCategory;
  dataOrigin: 'scraped';
  sourceName: string;
  sourceRef: string;
  collectedAt: string;
  verificationTier: 1;
  content: ListingContent;
}

export interface ImportPlan {
  listings: ImportedListing[];
  skipped: string[];
  errors: string[];
}

export interface ImportOptions {
  /** `${category}|${link}` → ID đang dùng, để link và đơn cũ không bị hỏng. Không có thì sinh từ link. */
  existingIds: Record<string, string>;
  collectedAt: string;
  sourceName: string;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

/** Link nhóm Facebook chung của cả vùng không phải trang của cơ sở. */
const isOwnFacebook = (url?: string) => Boolean(url && /^https?:\/\//.test(url) && !/facebook\.com\/groups\//i.test(url));

function parseVnd(priceStr?: string): number {
  if (!priceStr) return 0;
  const n = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) && n > 0 && n <= 100_000_000 ? n : 0;
}

export function buildImportPlan(records: ScrapedRecord[], opts: ImportOptions): ImportPlan {
  const plan: ImportPlan = { listings: [], skipped: [], errors: [] };
  const seen = new Map<string, string>();

  for (const raw of records) {
    const name = decode(raw.name || '');
    if (!LISTING_CATEGORIES.includes(raw.category as ServiceCategory)) {
      plan.skipped.push(`${name} (loại "${raw.category}" không phải cơ sở dịch vụ)`);
      continue;
    }
    const id = opts.existingIds[`${raw.category}|${raw.link || ''}`] || slugifyVi(raw.link || name);
    if (!isValidListingId(id)) {
      plan.errors.push(`ID không hợp lệ "${id}" cho "${name}"`);
      continue;
    }
    if (seen.has(id)) {
      plan.errors.push(`ID trùng "${id}": "${seen.get(id)}" và "${name}"`);
      continue;
    }

    const images = (raw.images && raw.images.length ? raw.images : raw.img ? [raw.img] : []).filter((u) => /^https?:\/\//.test(u));
    const address = decode(raw.address || '');
    const result = validateListingContent({
      title: name,
      category: raw.category,
      area: areaFromAddress(`${address} ${name}`),
      address,
      phone: splitVnPhones(raw.phone)[0] || '',
      zalo: splitVnPhones(raw.zalo || raw.phone)[0] || '',
      facebook: isOwnFacebook(raw.facebook) ? raw.facebook : undefined,
      description: decode(raw.description || ''),
      coverImage: raw.img && /^https?:\/\//.test(raw.img) ? raw.img : images[0] || '',
      images: images.slice(0, 30),
      tags: (raw.tags || []).map(decode),
      minPrice: parseVnd(raw.priceStr),
      coordinates: null,
      // Chỉ theo thẻ do chính nguồn ghi, không suy đoán.
      hasCloudView: (raw.tags || []).some((t) => /(săn|biển) mây|view mây/i.test(t)),
      isInstantBooking: false,
    });
    if (!result.ok) {
      plan.errors.push(`"${name}": ${result.errors.map((e) => `${e.field} – ${e.message}`).join('; ')}`);
      continue;
    }

    seen.set(id, name);
    plan.listings.push({
      id,
      category: raw.category as ServiceCategory,
      dataOrigin: 'scraped',
      sourceName: opts.sourceName,
      sourceRef: raw.link || '',
      collectedAt: opts.collectedAt,
      verificationTier: 1,
      content: result.content,
    });
  }
  return plan;
}

const sqlValue = (v: string | number | null): string =>
  v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`;

export const importVersionId = (listingId: string) => `${listingId}-import-v1`;

/** SQL chèn-nếu-chưa-có cho kế hoạch nhập. Dùng cho file migration D1 và cho test. */
export function renderSql(plan: ImportPlan, now = `${plan.listings[0]?.collectedAt ?? '2026-01-01'}T00:00:00.000Z`): string {
  const lines: string[] = [];
  for (const l of plan.listings) {
    const versionId = importVersionId(l.id);
    lines.push(
      `INSERT OR IGNORE INTO listings (id, category, status, data_origin, source_name, source_ref, collected_at, verification_tier, published_version_id, created_by, created_at, updated_at) VALUES (${[
        l.id, l.category, 'approved', l.dataOrigin, l.sourceName, l.sourceRef, l.collectedAt, l.verificationTier, versionId, 'importer', now, now,
      ].map(sqlValue).join(', ')});`
    );
    lines.push(
      `INSERT OR IGNORE INTO listing_versions (id, listing_id, version_no, status, content_json, created_by, created_at, reviewed_by, reviewed_at, review_note) VALUES (${[
        versionId, l.id, 1, 'approved', JSON.stringify(l.content), 'importer', now, 'importer', now, 'Nhập từ nguồn thu thập công khai, chưa xác minh',
      ].map(sqlValue).join(', ')});`
    );
  }
  return lines.join('\n') + '\n';
}
