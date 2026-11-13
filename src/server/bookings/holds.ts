/**
 * N05.2 — Giữ chỗ có hạn, nguyên tử, chống đặt trùng và chống tạo đơn lặp.
 *
 * D1 không có transaction tương tác, nên mỗi thao tác là MỘT batch (chạy trọn hoặc không chạy gì):
 *  - mỗi đêm: INSERT … SELECT … WHERE còn đủ phòng (tính trong cùng câu lệnh)
 *  - voucher có giới hạn: INSERT lượt dùng … WHERE còn lượt
 *  - một dòng batch_assertions có CHECK(ok = 1): thiếu bất kỳ đêm/lượt nào → CHECK lỗi → cả batch hủy.
 * Thứ tự ghi luôn: đơn → các đêm theo ngày tăng dần → voucher → kiểm tra.
 * Thời gian (now) truyền vào để test bằng đồng hồ kiểm soát.
 */
import type { D1Database } from '../d1.ts';
import type { ListingContent } from '../listings/content.ts';
import type { StayQuote } from '../pricing/quote.ts';
import { applyVoucher } from '../pricing/quote.ts';
import { VoucherStore } from '../pricing/store.ts';
import { ListingStore } from '../listings/store.ts';
import { InventoryStore } from '../inventory/store.ts';
import { ACTIVE_ALLOCATION_SQL } from '../inventory/availability.ts';
import { todayInVietnam } from '../../search/searchIntent.ts';

export const HOLD_TTL_MS = 30 * 60 * 1000; // D04: giữ chỗ chờ cọc 30 phút
export const DEPOSIT_PERCENT = 30; // D03: cọc 30%

/** Cọc 30% làm tròn LÊN tới đồng (không thu thiếu cho cơ sở). */
export const depositFor = (total: number) => Math.ceil((total * DEPOSIT_PERCENT) / 100);

/** Trạng thái đơn còn chiếm lượt voucher (giữ chỗ còn hạn hoặc đã xác nhận trở đi). */
export const ACTIVE_BOOKING_SQL = `(b.status IN ('confirmed','checked_in','completed') OR (b.status = 'pending_deposit' AND b.hold_expires_at > ?))`;

export interface Actor {
  id: string;
  role: 'traveler' | 'partner' | 'admin';
}

export interface HoldInput {
  quoteId: string;
  idempotencyKey: string;
  guestName: string;
  guestPhone: string;
  guestNote?: string;
  attribution?: unknown;
}

export interface BookingView {
  id: string;
  bookingCode: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  providerId: string | null;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  roomTypeId: string | null;
  roomName: string | null;
  rooms: number | null;
  adults: number | null;
  children: number | null;
  subtotal: number | null;
  discount: number | null;
  voucherCode: string | null;
  totalAmount: number;
  depositAmount: number;
  status: string;
  holdExpiresAt: string | null;
  quoteId: string | null;
  guestNote: string | null;
  confirmedAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HoldResult =
  | { ok: true; replay: boolean; booking: BookingView }
  | { ok: false; status: number; code: string; message: string };

const fail = (status: number, code: string, message: string): HoldResult => ({ ok: false, status, code, message });
const rand = (n: number, alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789') => {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};
export const newBookingId = () => `bk_${rand(20)}`;
/** Mã đơn đọc được, ngẫu nhiên (bỏ cách lấy 4 số cuối timestamp). Bỏ 0/O/1/I dễ nhầm. */
export const newBookingCode = () => `TX${rand(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')}`;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const BOOKING_COLUMNS = `id, booking_code, user_id, listing_id, listing_title, provider_id, guest_name, guest_phone,
  check_in_date, check_out_date, room_type_id, room_name, rooms, adults, children, subtotal, discount, voucher_code,
  total_amount, deposit_amount, status, hold_expires_at, quote_id, guest_note, confirmed_at, checked_in_at, completed_at,
  cancelled_at, cancel_reason, created_at, updated_at, request_hash`;

export function toBookingView(r: any): BookingView {
  return {
    id: r.id,
    bookingCode: r.booking_code,
    userId: r.user_id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    providerId: r.provider_id ?? null,
    guestName: r.guest_name,
    guestPhone: r.guest_phone,
    checkInDate: r.check_in_date,
    checkOutDate: r.check_out_date,
    roomTypeId: r.room_type_id ?? null,
    roomName: r.room_name ?? null,
    rooms: r.rooms ?? null,
    adults: r.adults ?? null,
    children: r.children ?? null,
    subtotal: r.subtotal ?? null,
    discount: r.discount ?? null,
    voucherCode: r.voucher_code ?? null,
    totalAmount: r.total_amount,
    depositAmount: r.deposit_amount,
    status: r.status,
    holdExpiresAt: r.hold_expires_at ?? null,
    quoteId: r.quote_id ?? null,
    guestNote: r.guest_note ?? null,
    confirmedAt: r.confirmed_at ?? null,
    checkedInAt: r.checked_in_at ?? null,
    completedAt: r.completed_at ?? null,
    cancelledAt: r.cancelled_at ?? null,
    cancelReason: r.cancel_reason ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** 2026-11-19 → 19/11/2026 (chữ trong thông báo). */
export const viDate = (d: string) => d.split('-').reverse().join('/');

/** Một dòng lịch sử trạng thái đơn (N05.3). */
export function bookingEventStmt(
  d1: D1Database,
  e: { bookingId: string; action: string; from: string | null; to: string; actor: { id: string | null; role: string }; reason?: string | null; now: string }
) {
  return d1
    .prepare('INSERT INTO booking_events (id, booking_id, action, from_status, to_status, actor_id, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(`ev_${rand(20)}`, e.bookingId, e.action, e.from, e.to, e.actor.id, e.actor.role, e.reason ?? null, e.now);
}

/** Thông báo chuông cho mọi tài khoản chủ của cơ sở (Q3). */
export function notifyOwnersStmt(
  d1: D1Database,
  n: { listingId: string; kind: string; bookingId: string; title: string; body: string; now: string }
) {
  return d1
    .prepare(
      `INSERT INTO notifications (id, user_id, kind, booking_id, title, body, created_at, read_at)
       SELECT 'nt_' || lower(hex(randomblob(10))), p.user_id, ?, ?, ?, ?, ?, NULL
       FROM provider_listings pl JOIN providers p ON p.id = pl.provider_id
       WHERE pl.listing_id = ?`
    )
    .bind(n.kind, n.bookingId, n.title.slice(0, 120), n.body.slice(0, 300), n.now, n.listingId);
}

export class HoldStore {
  constructor(private d1: D1Database) {}

  assertion(okSql: string, ...params: unknown[]) {
    const id = `as_${rand(16)}`;
    return [
      this.d1.prepare(`INSERT INTO batch_assertions (id, ok) SELECT ?, CASE WHEN ${okSql} THEN 1 ELSE 0 END`).bind(id, ...params),
      this.d1.prepare('DELETE FROM batch_assertions WHERE id = ?').bind(id),
    ];
  }

  async getBooking(id: string): Promise<(BookingView & { requestHash: string | null }) | null> {
    const r = await this.d1.prepare(`SELECT ${BOOKING_COLUMNS} FROM bookings WHERE id = ?`).bind(id).first<any>();
    return r ? { ...toBookingView(r), requestHash: r.request_hash ?? null } : null;
  }

  private async findByKey(userId: string, key: string) {
    return this.d1.prepare(`SELECT ${BOOKING_COLUMNS} FROM bookings WHERE user_id = ? AND idempotency_key = ?`).bind(userId, key).first<any>();
  }

  async createHold(actor: Actor, input: HoldInput, now: Date = new Date()): Promise<HoldResult> {
    const requestHash = await sha256Hex(
      JSON.stringify([input.quoteId, input.guestName, input.guestPhone, input.guestNote || ''])
    );
    const replay = async (): Promise<HoldResult | null> => {
      const existing = await this.findByKey(actor.id, input.idempotencyKey);
      if (!existing) return null;
      if (existing.request_hash !== requestHash) {
        return fail(422, 'IDEMPOTENCY_MISMATCH', 'Khóa yêu cầu đã dùng cho một đơn khác. Vui lòng tải lại trang rồi đặt lại.');
      }
      return { ok: true, replay: true, booking: toBookingView(existing) };
    };
    const previous = await replay();
    if (previous) return previous;

    const quoteRow = await this.d1
      .prepare('SELECT id, listing_id, listing_version_id, quote_json, expires_at FROM quotes WHERE id = ?')
      .bind(input.quoteId)
      .first<{ id: string; listing_id: string; listing_version_id: string; quote_json: string; expires_at: string }>();
    if (!quoteRow) return fail(404, 'QUOTE_NOT_FOUND', 'Không tìm thấy báo giá. Vui lòng xem lại giá rồi đặt.');
    if (Date.parse(quoteRow.expires_at) <= now.getTime()) return fail(409, 'QUOTE_EXPIRED', 'Báo giá đã quá 30 phút. Vui lòng xem lại giá mới rồi đặt.');
    const quote = JSON.parse(quoteRow.quote_json) as StayQuote;

    const listings = new ListingStore(this.d1);
    const published = await listings.getPublishedForQuote(quoteRow.listing_id);
    if (!published) return fail(404, 'LISTING_NOT_FOUND', 'Cơ sở không còn nhận đặt.');
    if (published.versionId !== quoteRow.listing_version_id) {
      return fail(409, 'LISTING_CHANGED', 'Thông tin hoặc giá của cơ sở vừa thay đổi. Vui lòng xem lại giá mới rồi đặt.');
    }
    const content = published.content as ListingContent;
    const room = (content.roomTypes || []).find((r) => r.id === quote.roomTypeId);
    if (!room) return fail(409, 'LISTING_CHANGED', 'Hạng phòng không còn. Vui lòng chọn lại.');

    let voucherLimited = false;
    if (quote.voucherCode) {
      const v = await new VoucherStore(this.d1).get(quote.voucherCode, now);
      const check = v ? applyVoucher(v, { listingId: quoteRow.listing_id, category: content.category, subtotal: quote.subtotal, today: todayInVietnam(now) }) : null;
      if (!check || !check.ok) {
        const code = check && !check.ok ? check.code : 'VOUCHER_NOT_FOUND';
        return fail(409, code, check && !check.ok ? check.message : 'Mã giảm giá không còn áp dụng. Vui lòng xem lại giá.');
      }
      voucherLimited = v!.usageLimit !== null;
    }

    const owner = await this.d1
      .prepare('SELECT provider_id FROM provider_listings WHERE listing_id = ? ORDER BY is_primary_owner DESC, created_at LIMIT 1')
      .bind(quoteRow.listing_id)
      .first<{ provider_id: string }>();

    const id = newBookingId();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + HOLD_TTL_MS).toISOString();
    const nights = quote.nights.map((n) => n.date).sort();

    const stmts = [
      this.d1
        .prepare(
          `INSERT INTO bookings (id, booking_code, user_id, listing_id, listing_title, provider_id, guest_name, guest_phone,
             check_in_date, check_out_date, room_type_id, room_name, rooms, adults, children, subtotal, discount, voucher_code,
             total_amount, deposit_amount, status, quote_id, listing_version_id, hold_expires_at, idempotency_key, request_hash,
             attribution_json, guest_note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_deposit', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id, newBookingCode(), actor.id, quoteRow.listing_id, content.title, owner?.provider_id ?? null, input.guestName, input.guestPhone,
          quote.checkIn, quote.checkOut, room.id, room.name, quote.rooms, quote.adults, quote.children, quote.subtotal, quote.discount,
          quote.voucherCode, quote.total, depositFor(quote.total), quoteRow.id, quoteRow.listing_version_id, expiresAt,
          input.idempotencyKey, requestHash, input.attribution ? JSON.stringify(input.attribution).slice(0, 2000) : null,
          input.guestNote || null, nowIso, nowIso
        ),
      // Mỗi đêm chỉ ghi khi còn đủ phòng, tính ngay trong câu lệnh (cùng batch → không có khe tranh chấp).
      ...nights.map((date) =>
        this.d1
          .prepare(
            `INSERT INTO room_night_allocations (id, listing_id, room_type_id, date, quantity, status, source_type, source_id, expires_at, created_at, updated_at)
             SELECT ?, ?, ?, ?, ?, 'held', 'booking', ?, ?, ?, ?
             WHERE ? - COALESCE((SELECT closed_rooms FROM room_night_closures WHERE listing_id = ? AND room_type_id = ? AND date = ?), 0)
                     - COALESCE((SELECT SUM(quantity) FROM room_night_allocations WHERE listing_id = ? AND room_type_id = ? AND date = ? AND ${ACTIVE_ALLOCATION_SQL}), 0)
                   >= ?`
          )
          .bind(
            `${id}-${date}`, quoteRow.listing_id, room.id, date, quote.rooms, id, expiresAt, nowIso, nowIso,
            room.totalRooms, quoteRow.listing_id, room.id, date, quoteRow.listing_id, room.id, date, nowIso, quote.rooms
          )
      ),
    ];
    stmts.push(
      bookingEventStmt(this.d1, { bookingId: id, action: 'hold', from: null, to: 'pending_deposit', actor, now: nowIso }),
      notifyOwnersStmt(this.d1, {
        listingId: quoteRow.listing_id,
        kind: 'booking.hold',
        bookingId: id,
        title: 'Đơn mới đang chờ cọc',
        body: `${input.guestName} giữ ${quote.rooms} ${room.name}, ${viDate(quote.checkIn)} → ${viDate(quote.checkOut)}. Giữ chỗ 30 phút.`,
        now: nowIso,
      })
    );
    if (quote.voucherCode) {
      stmts.push(
        this.d1
          .prepare(
            `INSERT INTO voucher_redemptions (booking_id, code, created_at)
             SELECT ?, ?, ?
             WHERE (SELECT usage_limit FROM vouchers WHERE code = ?) IS NULL
                OR (SELECT used_count FROM vouchers WHERE code = ?)
                   + (SELECT COUNT(*) FROM voucher_redemptions r JOIN bookings b ON b.id = r.booking_id
                      WHERE r.code = ? AND b.id != ? AND ${ACTIVE_BOOKING_SQL})
                   < (SELECT usage_limit FROM vouchers WHERE code = ?)`
          )
          .bind(id, quote.voucherCode, nowIso, quote.voucherCode, quote.voucherCode, quote.voucherCode, id, nowIso, quote.voucherCode)
      );
    }
    stmts.push(
      ...this.assertion(
        `(SELECT COUNT(*) FROM room_night_allocations WHERE source_id = ?) = ? AND (? = 0 OR (SELECT COUNT(*) FROM voucher_redemptions WHERE booking_id = ?) = 1)`,
        id, nights.length, quote.voucherCode ? 1 : 0, id
      )
    );

    try {
      await this.d1.batch(stmts);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (/UNIQUE/i.test(msg) && /idempotency|bookings/i.test(msg)) {
        const r = await replay();
        if (r) return r;
      }
      if (!/CHECK constraint failed/i.test(msg)) throw err;
      // Batch đã hủy toàn bộ. Tìm lý do để báo cho khách.
      const avail = (await new InventoryStore(this.d1).forListing(quoteRow.listing_id, [room], quote.checkIn, quote.checkOut, now))[0];
      if (avail && avail.available < quote.rooms) {
        return fail(409, 'SOLD_OUT', avail.available === 0 ? 'Vừa hết phòng cho các đêm đã chọn.' : `Chỉ còn ${avail.available} phòng cho các đêm đã chọn.`);
      }
      if (voucherLimited) return fail(409, 'VOUCHER_USED_UP', 'Mã giảm giá vừa hết lượt dùng. Vui lòng xem lại giá.');
      return fail(409, 'SOLD_OUT', 'Vừa hết phòng cho các đêm đã chọn.');
    }

    const booking = await this.getBooking(id);
    return { ok: true, replay: false, booking: booking! };
  }

  /** Dọn giữ chỗ hết hạn (Cron Trigger). Tồn đã tự trả theo thời gian; hàm này chỉ ghi trạng thái cho đúng. */
  async expireHolds(now: Date = new Date()): Promise<{ expired: number; released: number }> {
    const nowIso = now.toISOString();
    const [, b, a] = await this.d1.batch([
      // Lịch sử trước, cùng điều kiện với câu UPDATE ngay sau (cùng batch → cùng tập đơn).
      this.d1
        .prepare(
          `INSERT INTO booking_events (id, booking_id, action, from_status, to_status, actor_id, actor_role, reason, created_at)
           SELECT 'ev_' || lower(hex(randomblob(10))), id, 'expire', 'pending_deposit', 'expired', NULL, 'system', NULL, ?
           FROM bookings WHERE status = 'pending_deposit' AND hold_expires_at <= ?`
        )
        .bind(nowIso, nowIso),
      this.d1.prepare(`UPDATE bookings SET status = 'expired', updated_at = ? WHERE status = 'pending_deposit' AND hold_expires_at <= ?`).bind(nowIso, nowIso),
      this.d1.prepare(`UPDATE room_night_allocations SET status = 'released', updated_at = ? WHERE status = 'held' AND expires_at <= ?`).bind(nowIso, nowIso),
    ]);
    return { expired: Number(b?.meta?.changes ?? 0), released: Number(a?.meta?.changes ?? 0) };
  }
}
