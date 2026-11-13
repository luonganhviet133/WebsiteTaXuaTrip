/**
 * N04 — Lưu báo giá (snapshot) và voucher trên D1/SQLite.
 */
import type { D1Database } from '../d1.ts';
import type { StayQuote, VoucherRecord } from './quote.ts';

// Giống ACTIVE_BOOKING_SQL trong bookings/holds.ts (không import để tránh vòng phụ thuộc).
const ACTIVE_BOOKING_SQL = `(b.status IN ('confirmed','checked_in','completed') OR (b.status = 'pending_deposit' AND b.hold_expires_at > ?))`;

const HOLIDAYS_KEY = 'pricing_holidays';

interface VoucherRow {
  code: string;
  title: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount: number | null;
  min_booking_amount: number;
  applicable_category: string;
  applicable_listing_id: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: number;
  usage_limit: number | null;
  used_count: number;
  description: string | null;
}

const toVoucher = (r: VoucherRow): VoucherRecord & { description: string | null } => ({
  code: r.code,
  title: r.title,
  discountType: r.discount_type,
  discountValue: r.discount_value,
  maxDiscount: r.max_discount,
  minBookingAmount: r.min_booking_amount,
  applicableCategory: r.applicable_category,
  applicableListingId: r.applicable_listing_id,
  validFrom: r.valid_from,
  validUntil: r.valid_until,
  isActive: Boolean(r.is_active),
  usageLimit: r.usage_limit,
  usedCount: r.used_count,
  description: r.description,
});

export const normalizeVoucherCode = (code: unknown) => (typeof code === 'string' ? code.trim().toUpperCase() : '');

export class VoucherStore {
  constructor(private d1: D1Database) {}

  /**
   * used_count (lượt ghi tay/cũ) + lượt của đơn còn hiệu lực (N05.2: giữ chỗ còn hạn, đã xác nhận trở đi).
   * Giữ chỗ hết hạn/hủy tự trả lượt.
   */
  private selectWithUsage = `SELECT v.code, v.title, v.discount_type, v.discount_value, v.max_discount, v.min_booking_amount,
      v.applicable_category, v.applicable_listing_id, v.valid_from, v.valid_until, v.is_active, v.usage_limit, v.description,
      v.used_count + (SELECT COUNT(*) FROM voucher_redemptions r JOIN bookings b ON b.id = r.booking_id
                      WHERE r.code = v.code AND ${ACTIVE_BOOKING_SQL}) AS used_count
    FROM vouchers v`;

  async get(code: string, now: Date = new Date()) {
    const r = await this.d1.prepare(`${this.selectWithUsage} WHERE v.code = ?`).bind(now.toISOString(), normalizeVoucherCode(code)).first<VoucherRow>();
    return r ? toVoucher(r) : null;
  }

  async list(now: Date = new Date()) {
    const res = await this.d1.prepare(`${this.selectWithUsage} ORDER BY v.created_at DESC`).bind(now.toISOString()).all<VoucherRow>();
    return (res.results || []).map(toVoucher);
  }

  async upsert(v: VoucherRecord & { description?: string | null }, actorId: string) {
    const now = new Date().toISOString();
    await this.d1
      .prepare(
        `INSERT INTO vouchers (code, title, discount_type, discount_value, max_discount, min_booking_amount, applicable_category,
           applicable_listing_id, valid_from, valid_until, is_active, usage_limit, used_count, description, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET title = excluded.title, discount_type = excluded.discount_type,
           discount_value = excluded.discount_value, max_discount = excluded.max_discount,
           min_booking_amount = excluded.min_booking_amount, applicable_category = excluded.applicable_category,
           applicable_listing_id = excluded.applicable_listing_id, valid_from = excluded.valid_from,
           valid_until = excluded.valid_until, is_active = excluded.is_active, usage_limit = excluded.usage_limit,
           description = excluded.description, updated_at = excluded.updated_at`
      )
      .bind(
        v.code, v.title, v.discountType, v.discountValue, v.maxDiscount, v.minBookingAmount, v.applicableCategory,
        v.applicableListingId, v.validFrom, v.validUntil, v.isActive ? 1 : 0, v.usageLimit, v.description ?? null, actorId, now, now
      )
      .run();
    return this.get(v.code);
  }

  /**
   * Dùng một lượt voucher. Một câu UPDATE có điều kiện nên nguyên tử trên D1/SQLite:
   * nhiều yêu cầu cùng lúc không vượt usage_limit. N05 gọi khi chốt giữ chỗ.
   */
  async redeem(code: string): Promise<boolean> {
    const res = await this.d1
      .prepare('UPDATE vouchers SET used_count = used_count + 1, updated_at = ? WHERE code = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)')
      .bind(new Date().toISOString(), normalizeVoucherCode(code))
      .run();
    return (res.meta?.changes ?? 0) === 1;
  }
}

export class QuoteStore {
  constructor(private d1: D1Database) {}

  async save(listingId: string, listingVersionId: string, request: unknown, quote: StayQuote): Promise<string> {
    const id = `q_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    await this.d1
      .prepare(
        `INSERT INTO quotes (id, listing_id, listing_version_id, rules_version, request_json, quote_json, subtotal, discount, total, voucher_code, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, listingId, listingVersionId, quote.rulesVersion, JSON.stringify(request), JSON.stringify(quote), quote.subtotal, quote.discount, quote.total, quote.voucherCode, quote.createdAt, quote.expiresAt)
      .run();
    return id;
  }

  async get(id: string): Promise<(StayQuote & { id: string; listingId: string; listingVersionId: string }) | null> {
    const r = await this.d1
      .prepare('SELECT id, listing_id, listing_version_id, quote_json FROM quotes WHERE id = ?')
      .bind(id)
      .first<{ id: string; listing_id: string; listing_version_id: string; quote_json: string }>();
    return r ? { ...JSON.parse(r.quote_json), id: r.id, listingId: r.listing_id, listingVersionId: r.listing_version_id } : null;
  }

  async getHolidays(): Promise<string[]> {
    const r = await this.d1.prepare('SELECT content_json AS c FROM site_content WHERE key = ?').bind(HOLIDAYS_KEY).first<{ c: string }>();
    return r ? (JSON.parse(r.c) as string[]) : [];
  }

  async setHolidays(dates: string[], actorId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.d1
      .prepare(
        `INSERT INTO site_content (key, content_json, updated_by, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET content_json = excluded.content_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
      )
      .bind(HOLIDAYS_KEY, JSON.stringify(dates), actorId, now)
      .run();
  }
}
