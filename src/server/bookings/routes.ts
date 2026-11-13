/**
 * N05.2 — Route giữ chỗ.
 *   POST /api/bookings/holds        đã đăng nhập; { quoteId, idempotencyKey, guestName, guestPhone, guestNote?, attribution? }
 *                                   201 đơn mới | 200 gửi lại cùng khóa | 409 SOLD_OUT/QUOTE_EXPIRED/LISTING_CHANGED/VOUCHER_* | 422
 *   POST /api/bookings/:id/cancel   chủ đơn hoặc admin; chỉ đơn đang giữ chỗ còn hạn
 * Tổng tiền và cọc lấy từ báo giá đã lưu ở server, không đọc từ trình duyệt.
 */
import { HoldStore } from './holds.ts';
import type { PricingRouteDeps } from '../pricing/routes.ts';

export async function handleBookingRoutes(request: Request, pathname: string, deps: PricingRouteDeps): Promise<Response | undefined> {
  const { json, readJson, requireRole, d1 } = deps;
  const holds = new HoldStore(d1);

  if (request.method === 'POST' && pathname === '/api/bookings/holds') {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    if (!deps.rateLimit(`hold:${user.id}`, 20)) return json({ success: false, code: 'RATE_LIMITED', error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau 1 phút.' }, 429);
    const b = await readJson(request);
    const quoteId = typeof b?.quoteId === 'string' ? b.quoteId.trim() : '';
    const key = typeof b?.idempotencyKey === 'string' ? b.idempotencyKey.trim() : '';
    const guestName = typeof b?.guestName === 'string' ? b.guestName.trim().slice(0, 100) : '';
    const guestPhone = typeof b?.guestPhone === 'string' ? b.guestPhone.replace(/[\s.]/g, '') : '';
    if (!quoteId || !/^[A-Za-z0-9_-]{1,80}$/.test(key)) return json({ success: false, code: 'INVALID_REQUEST', error: 'Thiếu mã báo giá hoặc khóa yêu cầu.' }, 400);
    if (guestName.length < 2) return json({ success: false, code: 'INVALID_NAME', error: 'Vui lòng nhập họ tên người nhận phòng.' }, 400);
    if (!/^(0|\+84)\d{9}$/.test(guestPhone)) return json({ success: false, code: 'INVALID_PHONE', error: 'Số điện thoại phải gồm 10 chữ số.' }, 400);
    const result = await holds.createHold(
      { id: user.id, role: user.role },
      {
        quoteId,
        idempotencyKey: key,
        guestName,
        guestPhone: guestPhone.replace(/^\+84/, '0'),
        guestNote: typeof b?.guestNote === 'string' ? b.guestNote.slice(0, 500) : undefined,
        attribution: b?.attribution && typeof b.attribution === 'object' ? b.attribution : undefined,
      }
    );
    if (!result.ok) return json({ success: false, code: result.code, error: result.message }, result.status);
    return json({ success: true, replay: result.replay, data: result.booking }, result.replay ? 200 : 201);
  }

  const cancel = request.method === 'POST' && pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
  if (cancel) {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const body = (await readJson(request)) || {};
    const r = await holds.cancelHold(decodeURIComponent(cancel[1]), { id: user.id, role: user.role }, typeof body.reason === 'string' ? body.reason.slice(0, 300) : undefined);
    if (!r.ok) return json({ success: false, code: r.code, error: r.message }, r.status);
    return json({ success: true, data: r.booking });
  }
  return undefined;
}
