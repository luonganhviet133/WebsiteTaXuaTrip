/**
 * N06.3 — Route đánh giá xác thực và khiếu nại.
 *   GET|POST /api/bookings/:id/review              trạng thái / viết đánh giá (khách của đơn đã hoàn tất)
 *   POST     /api/bookings/:id/review/photos       thêm ảnh thật (thân yêu cầu là ảnh)
 *   GET      /api/listings/:id/reviews             công khai: đánh giá đang hiện + điểm trung bình
 *   GET      /api/reviews/photos/:photoId          ảnh đánh giá (công khai khi đánh giá đang hiện)
 *   POST     /api/reviews/:id/reply                chủ cơ sở trả lời công khai
 *   GET      /api/admin/reviews, POST /api/admin/reviews/:id/hide
 *   GET|POST /api/bookings/:id/complaint           xem / mở khiếu nại
 *   POST     /api/bookings/:id/complaint/files     ảnh bằng chứng; GET .../files/:fileId
 *   POST     /api/bookings/:id/complaint/:action   assign | respond | withdraw | conclude | report_refund | ...
 *   GET      /api/admin/complaints
 */
import type { AuthenticatedUser } from '../auth.ts';
import type { PaymentRouteDeps } from '../payments/routes.ts';
import { MAX_RECEIPT_BYTES } from '../payments/store.ts';
import { FeedbackStore } from './store.ts';
import { COMPLAINT_RULES, type ComplaintAction } from './rules.ts';

export interface FeedbackRouteDeps extends PaymentRouteDeps {
  optionalUser: () => Promise<AuthenticatedUser | null>;
}

export async function handleFeedbackRoutes(request: Request, pathname: string, deps: FeedbackRouteDeps): Promise<Response | undefined> {
  const { json, readJson, requireRole, d1 } = deps;
  const method = request.method;
  const store = new FeedbackStore(d1, deps.privateStorage);
  const actorOf = (u: AuthenticatedUser) => ({ id: u.id, role: u.role, providerId: u.providerId ?? null });
  const out = (r: any, okStatus = 200) =>
    r.ok ? json({ success: true, already: r.already, data: r.data ?? null }, okStatus) : json({ success: false, code: r.code, error: r.message }, r.status);
  const image = (r: any, cache: string) =>
    r.ok
      ? new Response(r.bytes as BodyInit, {
          status: 200,
          headers: { 'Content-Type': r.contentType, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline' },
        })
      : json({ success: false, code: r.code, error: r.message }, r.status);
  const readImage = async () => {
    if (Number(request.headers.get('content-length') || 0) > MAX_RECEIPT_BYTES) return null;
    return new Uint8Array(await request.arrayBuffer());
  };
  const tooLarge = () => json({ success: false, code: 'TOO_LARGE', error: 'Ảnh tối đa 5 MB.' }, 413);

  const lr = pathname.match(/^\/api\/listings\/([^/]+)\/reviews$/);
  if (lr && method === 'GET') return out(await store.listingReviews(decodeURIComponent(lr[1])));

  const ph = pathname.match(/^\/api\/reviews\/photos\/([^/]+)$/);
  if (ph && method === 'GET') {
    const u = await deps.optionalUser();
    const r = await store.getReviewPhoto(decodeURIComponent(ph[1]), u ? actorOf(u) : null);
    return image(r, r.ok && (r as any).isPublic ? 'public, max-age=3600' : 'private, no-store');
  }

  const rp = pathname.match(/^\/api\/reviews\/([^/]+)\/reply$/);
  if (rp && method === 'POST') {
    const user = await requireRole(['partner', 'admin']);
    if (user instanceof Response) return user;
    return out(await store.reply(decodeURIComponent(rp[1]), actorOf(user), (await readJson(request)) || {}));
  }

  if (pathname === '/api/admin/reviews' && method === 'GET') {
    const user = await requireRole(['admin']);
    if (user instanceof Response) return user;
    return out(await store.adminReviews(actorOf(user)));
  }
  const hide = pathname.match(/^\/api\/admin\/reviews\/([^/]+)\/hide$/);
  if (hide && method === 'POST') {
    const user = await requireRole(['admin']);
    if (user instanceof Response) return user;
    return out(await store.hide(decodeURIComponent(hide[1]), actorOf(user), (await readJson(request)) || {}));
  }
  if (pathname === '/api/admin/complaints' && method === 'GET') {
    const user = await requireRole(['admin']);
    if (user instanceof Response) return user;
    return out(await store.adminComplaints(actorOf(user)));
  }

  const rv = pathname.match(/^\/api\/bookings\/([^/]+)\/review(?:\/(photos))?$/);
  if (rv) {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const bookingId = decodeURIComponent(rv[1]);
    if (!rv[2] && method === 'GET') return out(await store.reviewState(bookingId, actorOf(user)));
    if (!rv[2] && method === 'POST') return out(await store.createReview(bookingId, actorOf(user), (await readJson(request)) || {}), 201);
    if (rv[2] === 'photos' && method === 'POST') {
      const bytes = await readImage();
      if (!bytes) return tooLarge();
      return out(await store.addReviewPhoto(bookingId, actorOf(user), bytes), 201);
    }
    return json({ success: false, code: 'NOT_FOUND', error: 'API endpoint not found' }, 404);
  }

  const cp = pathname.match(/^\/api\/bookings\/([^/]+)\/complaint(?:\/([a-z_]+)(?:\/([^/]+))?)?$/);
  if (cp) {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const bookingId = decodeURIComponent(cp[1]);
    if (!cp[2] && method === 'GET') return out(await store.complaintView(bookingId, actorOf(user)));
    if (!cp[2] && method === 'POST') return out(await store.openComplaint(bookingId, actorOf(user), (await readJson(request)) || {}), 201);
    if (cp[2] === 'files' && !cp[3] && method === 'POST') {
      const bytes = await readImage();
      if (!bytes) return tooLarge();
      return out(await store.uploadComplaintFile(bookingId, actorOf(user), bytes), 201);
    }
    if (cp[2] === 'files' && cp[3] && method === 'GET') return image(await store.getComplaintFile(bookingId, decodeURIComponent(cp[3]), actorOf(user)), 'private, no-store');
    if (cp[2] && !cp[3] && method === 'POST' && cp[2] in COMPLAINT_RULES) {
      return out(await store.complaintAct(bookingId, cp[2] as ComplaintAction, actorOf(user), (await readJson(request)) || {}));
    }
    return json({ success: false, code: 'NOT_FOUND', error: 'API endpoint not found' }, 404);
  }
  return undefined;
}
