/**
 * N04 — Route báo giá, ngày lễ và voucher.
 *   POST /api/quotes                 công khai (giới hạn tần suất theo IP)
 *   GET  /api/quotes/:id             công khai (mã khó đoán)
 *   GET  /api/pricing/holidays       công khai
 *   PUT  /api/admin/pricing/holidays admin
 *   GET  /api/admin/vouchers, POST /api/admin/vouchers (tạo/cập nhật theo mã)  admin
 * Client không gửi được giá hay tổng tiền: server tính từ hồ sơ đã duyệt.
 */
import { ListingStore } from '../listings/store.ts';
import { LISTING_CATEGORIES } from '../listings/content.ts';
import { buildStayQuote, type VoucherRecord } from './quote.ts';
import { QuoteStore, VoucherStore, normalizeVoucherCode } from './store.ts';
import { isValidIsoDate } from '../../search/searchIntent.ts';
import type { ListingRouteDeps } from '../listings/routes.ts';
import type { D1Database } from '../d1.ts';

export interface PricingRouteDeps extends Omit<ListingRouteDeps, 'store'> {
  d1: D1Database;
  rateLimit: (key: string, max: number) => boolean;
  clientIp: string;
}

export async function handlePricingRoutes(request: Request, pathname: string, deps: PricingRouteDeps): Promise<Response | undefined> {
  const { json, readJson, requireRole, d1 } = deps;
  const method = request.method;
  const quotes = new QuoteStore(d1);
  const vouchers = new VoucherStore(d1);

  if (method === 'POST' && pathname === '/api/quotes') {
    if (!deps.rateLimit(`quote:${deps.clientIp}`, 60)) return json({ success: false, code: 'RATE_LIMITED', error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau 1 phút.' }, 429);
    const body = await readJson(request);
    if (!body || typeof body !== 'object') return json({ success: false, code: 'INVALID_JSON', error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
    const listingId = typeof body.listingId === 'string' ? body.listingId : '';
    const published = listingId ? await new ListingStore(d1).getPublishedForQuote(listingId) : null;
    if (!published) return json({ success: false, code: 'LISTING_NOT_FOUND', error: 'Không tìm thấy cơ sở hoặc cơ sở chưa được duyệt.' }, 404);

    const code = normalizeVoucherCode(body.voucherCode);
    const voucher = code ? await vouchers.get(code) : null;
    // Chỉ lấy đúng các trường lựa chọn; mọi trường giá/tổng client gửi kèm đều bị bỏ qua.
    const request_ = {
      roomTypeId: body.roomTypeId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      adults: body.adults,
      children: body.children ?? 0,
      rooms: body.rooms ?? 1,
    };
    const result = buildStayQuote(published.content, request_, {
      holidays: await quotes.getHolidays(),
      voucher,
      listingId,
    });
    if (!result.ok) {
      const status = result.code === 'NOT_QUOTABLE' ? 409 : 400;
      return json({ success: false, code: result.code, error: result.message }, status);
    }
    const quote = result.quote;
    if (code && !voucher) quote.voucherError = { code: 'VOUCHER_NOT_FOUND', message: 'Mã giảm giá không tồn tại.' };
    const id = await quotes.save(listingId, published.versionId, { ...request_, voucherCode: code || null }, quote);
    return json({ success: true, data: { id, listingId, ...quote } });
  }

  if (method === 'GET' && pathname.startsWith('/api/quotes/')) {
    const q = await quotes.get(decodeURIComponent(pathname.slice('/api/quotes/'.length)));
    if (!q) return json({ success: false, error: 'Không tìm thấy báo giá.' }, 404);
    return json({ success: true, data: q });
  }

  if (method === 'GET' && pathname === '/api/pricing/holidays') {
    return json({ success: true, data: await quotes.getHolidays() });
  }

  if (pathname === '/api/admin/pricing/holidays' && method === 'PUT') {
    const admin = await requireRole(['admin']);
    if (admin instanceof Response) return admin;
    const body = await readJson(request);
    const dates = body?.dates;
    if (!Array.isArray(dates) || dates.length > 200 || !dates.every(isValidIsoDate)) {
      return json({ success: false, error: 'Danh sách ngày lễ phải là ngày dạng YYYY-MM-DD (tối đa 200 ngày).' }, 400);
    }
    await quotes.setHolidays([...new Set(dates as string[])].sort(), admin.id);
    return json({ success: true, data: await quotes.getHolidays() });
  }

  if (pathname === '/api/admin/vouchers') {
    const admin = await requireRole(['admin']);
    if (admin instanceof Response) return admin;
    if (method === 'GET') return json({ success: true, data: await vouchers.list() });
    if (method === 'POST') {
      const parsed = parseVoucher(await readJson(request));
      if ('error' in parsed) return json({ success: false, error: parsed.error }, 400);
      return json({ success: true, data: await vouchers.upsert(parsed, admin.id) }, 201);
    }
  }
  return undefined;
}

function parseVoucher(b: any): (VoucherRecord & { description: string | null }) | { error: string } {
  if (!b || typeof b !== 'object') return { error: 'Dữ liệu voucher không hợp lệ.' };
  const code = normalizeVoucherCode(b.code);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { error: 'Mã voucher 3–30 ký tự, chỉ gồm chữ không dấu, số, gạch.' };
  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 120) : '';
  if (!title) return { error: 'Cần tên voucher.' };
  if (b.discountType !== 'percent' && b.discountType !== 'fixed') return { error: 'Loại giảm giá phải là percent hoặc fixed.' };
  const intOk = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (!intOk(b.discountValue, 1, b.discountType === 'percent' ? 100 : 100_000_000)) return { error: 'Giá trị giảm không hợp lệ (phần trăm 1–100, số tiền là số nguyên VND).' };
  if (b.maxDiscount != null && !intOk(b.maxDiscount, 1, 100_000_000)) return { error: 'Mức giảm tối đa không hợp lệ.' };
  if (!intOk(b.minBookingAmount ?? 0, 0, 1_000_000_000)) return { error: 'Giá trị đơn tối thiểu không hợp lệ.' };
  const category = b.applicableCategory ?? 'all';
  if (category !== 'all' && !LISTING_CATEGORIES.includes(category)) return { error: 'Loại dịch vụ áp dụng không hợp lệ.' };
  for (const k of ['validFrom', 'validUntil'] as const) if (b[k] != null && !isValidIsoDate(b[k])) return { error: `${k} phải là ngày YYYY-MM-DD.` };
  if (b.usageLimit != null && !intOk(b.usageLimit, 1, 1_000_000)) return { error: 'Giới hạn lượt dùng không hợp lệ.' };
  return {
    code,
    title,
    discountType: b.discountType,
    discountValue: b.discountValue,
    maxDiscount: b.maxDiscount ?? null,
    minBookingAmount: b.minBookingAmount ?? 0,
    applicableCategory: category,
    applicableListingId: typeof b.applicableListingId === 'string' && b.applicableListingId ? b.applicableListingId : null,
    validFrom: b.validFrom ?? null,
    validUntil: b.validUntil ?? null,
    isActive: b.isActive !== false,
    usageLimit: b.usageLimit ?? null,
    usedCount: 0,
    description: typeof b.description === 'string' ? b.description.slice(0, 500) : null,
  };
}
