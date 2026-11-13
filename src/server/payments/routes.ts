/**
 * N06.1 — Route thanh toán (D03: chuyển thẳng tài khoản cơ sở, cơ sở xác nhận thủ công có log).
 *   GET|PUT /api/partner/listings/:id/payout-account     tài khoản nhận cọc (chủ cơ sở/admin)
 *   GET  /api/bookings/:id/payment                       điều khoản, snapshot, biên lai, mốc 70% (khách/chủ/admin)
 *   POST /api/bookings/:id/payment/accept-terms          khách tick điều khoản → chụp snapshot
 *   POST /api/bookings/:id/payment/receipts?kind=…       khách gửi ảnh biên lai (thân yêu cầu là ảnh)
 *   GET  /api/bookings/:id/payment/receipts/:rid         xem ảnh (khách/chủ/admin)
 *   POST /api/bookings/:id/payment/confirm-balance       chủ cơ sở xác nhận đã nhận đủ 70%
 */
import type { AuthenticatedUser } from '../auth.ts';
import type { PricingRouteDeps } from '../pricing/routes.ts';
import { MAX_RECEIPT_BYTES, PaymentStore } from './store.ts';
import type { PrivateStorage } from './storage.ts';

export interface PaymentRouteDeps extends PricingRouteDeps {
  privateStorage?: PrivateStorage;
}

export async function handlePaymentRoutes(request: Request, pathname: string, deps: PaymentRouteDeps): Promise<Response | undefined> {
  const { json, readJson, requireRole, d1 } = deps;
  const method = request.method;
  const store = new PaymentStore(d1, deps.privateStorage);
  const actorOf = (u: AuthenticatedUser) => ({ id: u.id, role: u.role, providerId: u.providerId ?? null });
  const out = (r: any, okStatus = 200) =>
    r.ok ? json({ success: true, already: r.already, data: r.data ?? null }, okStatus) : json({ success: false, code: r.code, error: r.message }, r.status);

  const payout = pathname.match(/^\/api\/partner\/listings\/([^/]+)\/payout-account$/);
  if (payout && (method === 'GET' || method === 'PUT')) {
    const user = await requireRole(['partner', 'admin']);
    if (user instanceof Response) return user;
    const listingId = decodeURIComponent(payout[1]);
    if (method === 'GET') return out(await store.getPayout(listingId, actorOf(user)));
    return out(await store.setPayout(listingId, actorOf(user), await readJson(request)));
  }

  const m = pathname.match(/^\/api\/bookings\/([^/]+)\/payment(?:\/(accept-terms|receipts|confirm-balance)(?:\/([^/]+))?)?$/);
  if (!m) return undefined;
  const user = await requireRole(['traveler', 'partner', 'admin']);
  if (user instanceof Response) return user;
  const bookingId = decodeURIComponent(m[1]);
  const sub = m[2];

  if (!sub && method === 'GET') return out(await store.view(bookingId, actorOf(user)));
  if (sub === 'accept-terms' && method === 'POST') {
    const body = (await readJson(request)) || {};
    return out(await store.acceptTerms(bookingId, actorOf(user), String(body.termsVersion || '')));
  }
  if (sub === 'confirm-balance' && method === 'POST') return out(await store.confirmBalance(bookingId, actorOf(user)));
  if (sub === 'receipts' && method === 'POST' && !m[3]) {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_RECEIPT_BYTES) return json({ success: false, code: 'TOO_LARGE', error: 'Ảnh tối đa 5 MB.' }, 413);
    const bytes = new Uint8Array(await request.arrayBuffer());
    const kind = new URL(request.url).searchParams.get('kind') || '';
    return out(await store.uploadReceipt(bookingId, actorOf(user), kind, bytes), 201);
  }
  if (sub === 'receipts' && method === 'GET' && m[3]) {
    const r = await store.getReceipt(bookingId, decodeURIComponent(m[3]), actorOf(user));
    if (!r.ok) return json({ success: false, code: r.code, error: r.message }, r.status);
    return new Response(r.bytes as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': r.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  }
  return json({ success: false, code: 'NOT_FOUND', error: 'API endpoint not found' }, 404);
}
