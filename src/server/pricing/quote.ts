/**
 * N04.2/N04.3 — Báo giá lưu trú phía server (D04) và kiểm tra voucher.
 * - Giá theo từng đêm: đêm bắt đầu vào thứ Sáu, thứ Bảy hoặc ngày lễ (admin nhập) dùng giá cuối tuần.
 * - Tiền là số nguyên VND. Không có giá trẻ em riêng; trẻ em tính vào sức chứa phòng.
 * - Báo giá có hạn 30 phút (bằng thời gian giữ chỗ chờ cọc D04).
 * File thuần (không truy cập DB) để test; store lưu snapshot.
 */
import type { ListingContent } from '../listings/content.ts';
import { isValidIsoDate, nightsBetween, addDays, todayInVietnam, MAX_NIGHTS } from '../../search/searchIntent.ts';

export const PRICING_RULES_VERSION = 'd04-v1';
export const QUOTE_TTL_MS = 30 * 60 * 1000;

export type NightKind = 'weekday' | 'weekend' | 'holiday';

export interface StayQuoteRequest {
  roomTypeId: unknown;
  checkIn: unknown;
  checkOut: unknown;
  adults: unknown;
  children: unknown;
  rooms: unknown;
}

export interface VoucherRecord {
  code: string;
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscount: number | null;
  minBookingAmount: number;
  applicableCategory: string;
  applicableListingId: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
}

export interface StayQuote {
  rulesVersion: string;
  currency: 'VND';
  roomTypeId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  nights: Array<{ date: string; kind: NightKind; pricePerRoom: number }>;
  subtotal: number;
  discount: number;
  total: number;
  voucherCode: string | null;
  voucherError: { code: string; message: string } | null;
  createdAt: string;
  expiresAt: string;
}

export type QuoteResult =
  | { ok: true; quote: StayQuote }
  | { ok: false; code: string; message: string };

const fail = (code: string, message: string): QuoteResult => ({ ok: false, code, message });
const isNonNegInt = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;

export function nightKind(date: string, holidays: string[]): NightKind {
  if (holidays.includes(date)) return 'holiday';
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return dow === 5 || dow === 6 ? 'weekend' : 'weekday';
}

export type VoucherCheck = { ok: true; discount: number } | { ok: false; code: string; message: string };

export function applyVoucher(
  v: VoucherRecord,
  ctx: { listingId: string; category: string; subtotal: number; today: string }
): VoucherCheck {
  const no = (code: string, message: string): VoucherCheck => ({ ok: false, code, message });
  if (!v.isActive) return no('VOUCHER_INACTIVE', 'Mã giảm giá đã ngừng áp dụng.');
  if (v.validFrom && ctx.today < v.validFrom) return no('VOUCHER_NOT_STARTED', 'Mã giảm giá chưa đến ngày áp dụng.');
  if (v.validUntil && ctx.today > v.validUntil) return no('VOUCHER_EXPIRED', 'Mã giảm giá đã hết hạn.');
  if (v.applicableCategory !== 'all' && v.applicableCategory !== ctx.category) return no('VOUCHER_WRONG_CATEGORY', 'Mã không áp dụng cho loại dịch vụ này.');
  if (v.applicableListingId && v.applicableListingId !== ctx.listingId) return no('VOUCHER_WRONG_LISTING', 'Mã không áp dụng cho cơ sở này.');
  if (ctx.subtotal < v.minBookingAmount) return no('VOUCHER_MIN_AMOUNT', `Đơn cần tối thiểu ${v.minBookingAmount.toLocaleString('vi-VN')}đ để dùng mã này.`);
  if (v.usageLimit !== null && v.usedCount >= v.usageLimit) return no('VOUCHER_USED_UP', 'Mã giảm giá đã hết lượt dùng.');
  let discount = v.discountType === 'percent' ? Math.floor((ctx.subtotal * v.discountValue) / 100) : v.discountValue;
  if (v.maxDiscount !== null) discount = Math.min(discount, v.maxDiscount);
  return { ok: true, discount: Math.max(0, Math.min(discount, ctx.subtotal)) };
}

export function buildStayQuote(
  listing: ListingContent & { id?: string },
  req: StayQuoteRequest,
  opts: { holidays: string[]; now?: Date; voucher?: VoucherRecord | null; listingId?: string; /** N05.1: phòng trống cả khoảng của hạng phòng đã chọn */ availableRooms?: number }
): QuoteResult {
  const now = opts.now || new Date();
  const today = todayInVietnam(now);
  const rooms = (listing.roomTypes || []).filter((r) => r.priceWeekday > 0 && r.priceWeekend > 0);
  if (!rooms.length) return fail('NOT_QUOTABLE', 'Cơ sở chưa cập nhật hạng phòng và giá; vui lòng liên hệ trực tiếp.');

  const room = rooms.find((r) => r.id === req.roomTypeId);
  if (!room) return fail('ROOM_NOT_FOUND', 'Không tìm thấy hạng phòng đã chọn.');
  if (!isValidIsoDate(req.checkIn) || !isValidIsoDate(req.checkOut)) return fail('INVALID_DATES', 'Ngày nhận/trả phòng không hợp lệ.');
  if (req.checkIn < today) return fail('DATE_IN_PAST', 'Ngày nhận phòng đã qua.');
  const nightsCount = nightsBetween(req.checkIn, req.checkOut);
  if (nightsCount < 1) return fail('INVALID_DATES', 'Ngày trả phòng phải sau ngày nhận phòng.');
  if (nightsCount > MAX_NIGHTS) return fail('TOO_MANY_NIGHTS', `Đặt tối đa ${MAX_NIGHTS} đêm mỗi lần.`);
  if (!isNonNegInt(req.adults, 50) || req.adults < 1 || !isNonNegInt(req.children, 50)) return fail('INVALID_GUESTS', 'Số khách không hợp lệ.');
  if (!isNonNegInt(req.rooms, 20) || req.rooms < 1) return fail('INVALID_ROOMS', 'Số phòng không hợp lệ.');
  if (req.rooms > room.totalRooms) return fail('NOT_ENOUGH_ROOMS', `Hạng phòng này chỉ có ${room.totalRooms} phòng.`);
  if (opts.availableRooms !== undefined && req.rooms > opts.availableRooms) {
    return fail(
      'NOT_ENOUGH_ROOMS',
      opts.availableRooms === 0 ? 'Hạng phòng này đã hết phòng cho các đêm đã chọn.' : `Hạng phòng này chỉ còn ${opts.availableRooms} phòng trống cho các đêm đã chọn.`
    );
  }
  const guests = req.adults + req.children;
  if (guests > room.capacity * req.rooms) {
    return fail('OVER_CAPACITY', `${req.rooms} phòng "${room.name}" ở tối đa ${room.capacity * req.rooms} khách; bạn chọn ${guests} khách.`);
  }

  const nights = Array.from({ length: nightsCount }, (_, i) => {
    const date = addDays(req.checkIn as string, i);
    const kind = nightKind(date, opts.holidays);
    return { date, kind, pricePerRoom: kind === 'weekday' ? room.priceWeekday : room.priceWeekend };
  });
  const subtotal = nights.reduce((sum, n) => sum + n.pricePerRoom, 0) * req.rooms;
  if (!Number.isSafeInteger(subtotal)) return fail('INVALID_AMOUNT', 'Tổng tiền vượt giới hạn.');

  let discount = 0;
  let voucherCode: string | null = null;
  let voucherError: StayQuote['voucherError'] = null;
  if (opts.voucher) {
    const check = applyVoucher(opts.voucher, { listingId: opts.listingId || listing.id || '', category: listing.category, subtotal, today });
    if (check.ok) {
      discount = check.discount;
      voucherCode = opts.voucher.code;
    } else {
      voucherError = { code: check.code, message: check.message };
    }
  }

  return {
    ok: true,
    quote: {
      rulesVersion: PRICING_RULES_VERSION,
      currency: 'VND',
      roomTypeId: room.id,
      roomName: room.name,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      adults: req.adults,
      children: req.children,
      rooms: req.rooms,
      nights,
      subtotal,
      discount,
      total: subtotal - discount,
      voucherCode,
      voucherError,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
    },
  };
}
