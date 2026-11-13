/**
 * N05.2 — Route giữ chỗ.
 *   POST /api/bookings/holds        đã đăng nhập; { quoteId, idempotencyKey, guestName, guestPhone, guestNote?, attribution? }
 *                                   201 đơn mới | 200 gửi lại cùng khóa | 409 SOLD_OUT/QUOTE_EXPIRED/LISTING_CHANGED/VOUCHER_* | 422
 *   POST /api/bookings/:id/{confirm|reject|complete|cancel}   N05.3, theo bảng trong lifecycle.ts
 *   GET  /api/bookings/:id          khách/chủ cơ sở/admin; kèm lịch sử; mã QR chỉ cho khách khi đã xác nhận
 *   GET|POST /api/partner/checkin   xem/xác nhận nhận phòng bằng mã QR (chủ cơ sở của đơn, admin)
 *   GET  /api/partner/bookings      đơn của các cơ sở mình (admin: tất cả)
 *   GET  /api/notifications, POST /api/notifications/read   chuông thông báo
 * Tổng tiền và cọc lấy từ báo giá đã lưu ở server, không đọc từ trình duyệt.
 */
import { HoldStore } from './holds.ts';
import { BookingLifecycle, NotificationStore } from './store.ts';
import type { AuthenticatedUser } from '../auth.ts';
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

  const lifecycle = new BookingLifecycle(d1);
  const actorOf = (u: AuthenticatedUser) => ({ id: u.id, role: u.role, providerId: u.providerId ?? null });

  // N05.3 — đổi trạng thái đơn. Nhận phòng KHÔNG có ở đây: chỉ qua mã QR (/api/partner/checkin).
  const act = request.method === 'POST' && pathname.match(/^\/api\/bookings\/([^/]+)\/(confirm|reject|complete|cancel|release)$/);
  if (act) {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const action = act[2] as 'confirm' | 'reject' | 'complete' | 'cancel' | 'release';
    const body = (await readJson(request)) || {};
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : '';
    if (action === 'reject' && reason.length < 3) {
      return json({ success: false, code: 'REASON_REQUIRED', error: 'Vui lòng ghi lý do từ chối để báo cho khách.' }, 400);
    }
    const r = await lifecycle.act(decodeURIComponent(act[1]), action, actorOf(user), { reason: reason || undefined });
    if (!r.ok) return json({ success: false, code: r.code, error: r.message }, r.status);
    return json({ success: true, already: r.already, data: r.booking });
  }

  const detail = request.method === 'GET' && pathname.match(/^\/api\/bookings\/([^/]+)$/);
  if (detail) {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const r = await lifecycle.detail(decodeURIComponent(detail[1]), actorOf(user));
    if (!r.ok) return json({ success: false, code: r.code, error: r.message }, r.status);
    return json({ success: true, data: r.data });
  }

  if (pathname === '/api/partner/checkin' && (request.method === 'GET' || request.method === 'POST')) {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const token =
      request.method === 'GET'
        ? new URL(request.url).searchParams.get('token') || ''
        : String(((await readJson(request)) || {}).token || '');
    if (request.method === 'GET') {
      const r = await lifecycle.previewByToken(token, actorOf(user));
      if (!r.ok) return json({ success: false, code: r.code, error: r.message }, r.status);
      return json({ success: true, data: r.data });
    }
    const r = await lifecycle.checkInByToken(token, actorOf(user));
    if (!r.ok) return json({ success: false, code: r.code, error: r.message }, r.status);
    return json({ success: true, already: r.already, data: r.booking });
  }

  if (request.method === 'GET' && pathname === '/api/partner/bookings') {
    const user = await requireRole(['partner', 'admin']);
    if (user instanceof Response) return user;
    const listingId = new URL(request.url).searchParams.get('listingId') || undefined;
    return json({ success: true, data: await lifecycle.listForOwner(actorOf(user), listingId) });
  }

  if (pathname === '/api/notifications' && request.method === 'GET') {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    return json({ success: true, data: await new NotificationStore(d1).list(user.id) });
  }
  if (pathname === '/api/notifications/read' && request.method === 'POST') {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const body = (await readJson(request)) || {};
    const ids = body.all === true ? 'all' : Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : [];
    await new NotificationStore(d1).markRead(user.id, ids);
    return json({ success: true });
  }

  return undefined;
}
