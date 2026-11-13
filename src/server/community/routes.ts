/**
 * N06.2 — Route Điểm Mây (đóng góp), bảng xếp hạng, top 3 tháng, phí nền tảng.
 *   GET  /api/me/points                               điểm 12 tháng, danh hiệu, lịch sử
 *   POST /api/me/points/redeem                        đổi quà (đang khóa)
 *   GET  /api/community/leaderboard?scope=month|12m   công khai, tên rút gọn
 *   GET  /api/community/monthly-winners?month=        công khai
 *   GET  /api/admin/community/monthly?month=          admin: xếp hạng + quà đã ghi
 *   POST /api/admin/community/monthly/:month/award    admin chốt hạng và ghi quà
 *   POST /api/admin/points/award, /api/admin/points/:id/revoke, GET /api/admin/points?email=
 *   GET  /api/admin/fees/rates, PUT /api/admin/fees/rates/:listingId
 *   GET  /api/admin/fees/ledger?month=, POST /api/admin/fees/ledger/:id/reverse
 *   GET  /api/partner/fees?month=                     chủ cơ sở xem sổ phí cơ sở mình
 */
import type { AuthenticatedUser } from '../auth.ts';
import type { PricingRouteDeps } from '../pricing/routes.ts';
import { vnMonth } from '../../config/community.ts';
import { CommunityStore } from './store.ts';

export async function handleCommunityRoutes(request: Request, pathname: string, deps: PricingRouteDeps): Promise<Response | undefined> {
  const { json, readJson, requireRole, d1 } = deps;
  const method = request.method;
  const url = new URL(request.url);
  const store = new CommunityStore(d1);
  const actorOf = (u: AuthenticatedUser) => ({ id: u.id, role: u.role, providerId: u.providerId ?? null });
  const out = (r: any) => (r.ok ? json({ success: true, data: r.data ?? null }) : json({ success: false, code: r.code, error: r.message }, r.status));
  const month = () => url.searchParams.get('month') || vnMonth(new Date());

  if (pathname === '/api/me/points' && method === 'GET') {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    return json({ success: true, data: await store.me(user.id) });
  }
  if (pathname === '/api/me/points/redeem' && method === 'POST') {
    const user = await requireRole(['traveler', 'partner', 'admin']);
    if (user instanceof Response) return user;
    const body = (await readJson(request)) || {};
    const r = await store.redeem(user.id, String(body.rewardId || ''), String(body.idempotencyKey || ''));
    return r.ok ? json({ success: true, data: { giftCode: r.giftCode, replay: r.replay } }) : json({ success: false, code: r.code, error: r.message }, r.status);
  }
  if (pathname === '/api/community/leaderboard' && method === 'GET') {
    return out(await store.leaderboard(url.searchParams.get('scope') || 'month', url.searchParams.get('month')));
  }
  if (pathname === '/api/community/monthly-winners' && method === 'GET') return out(await store.monthlyWinners(month()));

  if (pathname === '/api/partner/fees' && method === 'GET') {
    const user = await requireRole(['partner']);
    if (user instanceof Response) return user;
    return out(await store.partnerFees(actorOf(user), month()));
  }

  if (!pathname.startsWith('/api/admin/')) return undefined;
  const isOurs =
    pathname.startsWith('/api/admin/community/') || pathname.startsWith('/api/admin/points') || pathname.startsWith('/api/admin/fees/');
  if (!isOurs) return undefined;
  const user = await requireRole(['admin']);
  if (user instanceof Response) return user;
  const admin = actorOf(user);
  const body = method === 'POST' || method === 'PUT' ? (await readJson(request)) || {} : {};

  if (pathname === '/api/admin/community/monthly' && method === 'GET') return out(await store.adminMonthly(month()));
  const aw = pathname.match(/^\/api\/admin\/community\/monthly\/([^/]+)\/award$/);
  if (aw && method === 'POST') return out(await store.awardMonthly(decodeURIComponent(aw[1]), body, admin));
  if (pathname === '/api/admin/points/award' && method === 'POST') return out(await store.award(body, admin));
  if (pathname === '/api/admin/points' && method === 'GET') return out(await store.adminLedger({ userEmail: url.searchParams.get('email') }));
  const rv = pathname.match(/^\/api\/admin\/points\/([^/]+)\/revoke$/);
  if (rv && method === 'POST') return out(await store.revoke(decodeURIComponent(rv[1]), body, admin));
  if (pathname === '/api/admin/fees/rates' && method === 'GET') return out(await store.listRates());
  const rate = pathname.match(/^\/api\/admin\/fees\/rates\/([^/]+)$/);
  if (rate && method === 'PUT') return out(await store.setRate(decodeURIComponent(rate[1]), body, admin));
  if (pathname === '/api/admin/fees/ledger' && method === 'GET') return out(await store.adminFees(month()));
  const rf = pathname.match(/^\/api\/admin\/fees\/ledger\/([^/]+)\/reverse$/);
  if (rf && method === 'POST') return out(await store.reverseFee(decodeURIComponent(rf[1]), body, admin));
  return json({ success: false, code: 'NOT_FOUND', error: 'API endpoint not found' }, 404);
}
