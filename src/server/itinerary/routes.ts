/**
 * R5 — API lịch trình.
 *  POST /api/itinerary/plan          — dựng lịch (công khai, không cần đăng nhập). note/narrate dùng AI nếu đã mở và còn hạn mức.
 *  GET  /api/itinerary/meta          — tình trạng dữ liệu & AI cho giao diện.
 *  GET  /api/admin/itinerary-data    — admin xem dữ liệu chờ duyệt / đã duyệt.
 *  POST /api/admin/itinerary-data/review           — duyệt/từ chối hàng loạt.
 *  POST /api/admin/itinerary-data/(place|fact)/:id — sửa số liệu (chuyển lại chờ duyệt).
 */
import type { D1Database } from '../d1.ts';
import { isOpen } from '../../config/features.ts';
import { buildPlan, parsePlanRequest, type Catalog, type Plan } from '../../itinerary/engine.ts';
import { ItineraryAi, type AiConfig } from './ai.ts';
import { ItineraryDataAdmin, loadCatalog } from './store.ts';

export interface ItineraryRouteDeps {
  d1: D1Database;
  json: (data: unknown, status?: number, headers?: Record<string, string>) => Response;
  readJson: (request: Request) => Promise<any>;
  requireRole: (allowed?: Array<'traveler' | 'partner' | 'admin'>) => Promise<{ id: string } | Response>;
  rateLimit: (key: string, max: number) => boolean;
  clientIp: string;
  ai: AiConfig;
  aiFetch?: typeof fetch;
  now?: () => Date;
}

/** Chỉ trả chi tiết những cơ sở/điểm mà lịch có nhắc tới (kể cả phương án thay thế). */
export function refsFor(plan: Plan, catalog: Catalog) {
  const L = new Map(catalog.listings.map((l) => [l.id, l]));
  const P = new Map(catalog.places.map((p) => [p.id, p]));
  const listingIds = new Set<string>();
  const placeIds = new Set<string>(plan.extras);
  for (const d of plan.days) {
    for (const it of d.items) {
      const target = it.ref?.type === 'place' || (it.kind === 'place') ? placeIds : listingIds;
      if (it.ref) target.add(it.ref.id);
      for (const a of it.alternatives) target.add(a);
    }
  }
  for (const id of [...plan.stay.alternatives, ...plan.bus.alternatives, plan.stay.listingId, plan.bus.outboundListingId, plan.bus.inboundListingId]) if (id) listingIds.add(id);
  return {
    listings: Object.fromEntries([...listingIds].filter((id) => L.has(id)).map((id) => [id, L.get(id)!])),
    places: Object.fromEntries([...placeIds].filter((id) => P.has(id)).map((id) => [id, P.get(id)!])),
  };
}

export async function handleItineraryRoutes(request: Request, pathname: string, deps: ItineraryRouteDeps): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const { json } = deps;
  const now = deps.now?.() ?? new Date();

  if (pathname === '/api/itinerary/meta' && method === 'GET') {
    const catalog = await loadCatalog(deps.d1, now);
    const ai = new ItineraryAi(deps.d1, deps.ai, deps.aiFetch);
    return json({
      success: true,
      data: {
        aiAvailable: isOpen('itineraryAi') && ai.available(),
        counts: {
          homestays: catalog.listings.filter((l) => l.category === 'homestay').length,
          restaurants: catalog.listings.filter((l) => l.category === 'restaurant').length,
          coffees: catalog.listings.filter((l) => l.category === 'coffee').length,
          buses: catalog.listings.filter((l) => l.category === 'bus').length,
          busesWithTimes: catalog.listings.filter((l) => l.bus).length,
          places: catalog.places.length,
          placesScheduled: catalog.places.filter((p) => p.travelMinutes !== null).length,
          prices: catalog.listings.filter((l) => l.price).length,
        },
      },
    });
  }

  if (pathname === '/api/itinerary/plan' && method === 'POST') {
    if (!deps.rateLimit(`itin:${deps.clientIp}`, 30)) return json({ success: false, code: 'TOO_MANY_REQUESTS', error: 'Bạn thao tác hơi nhanh, thử lại sau một phút.' }, 429, { 'Retry-After': '60' });
    const body = await deps.readJson(request);
    if (body === null) return json({ success: false, code: 'INVALID_JSON', error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
    const parsed = parsePlanRequest(body, now);
    if (!parsed.ok) return json({ success: false, code: 'INVALID_INPUT', field: parsed.field, error: parsed.message }, 400);
    const req = parsed.value;
    const catalog = await loadCatalog(deps.d1, now);

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    const wantNarrate = body.narrate === true;
    const ai = new ItineraryAi(deps.d1, deps.ai, deps.aiFetch);
    const aiOpen = isOpen('itineraryAi') && ai.available();
    const aiInfo: Record<string, unknown> = { available: aiOpen, hints: null, narrated: false, skipped: null };

    if ((note || wantNarrate) && aiOpen && !deps.rateLimit(`itin-ai:${deps.clientIp}`, 6)) aiInfo.skipped = 'RATE_LIMIT';
    const canAi = aiOpen && aiInfo.skipped === null;

    if (note && canAi) {
      const hints = await ai.parseNote(note, catalog, now);
      if (hints) {
        aiInfo.hints = hints;
        if (body.applyHints !== false) {
          req.styles = [...new Set([...req.styles, ...hints.styles])].slice(0, 4);
          req.avoidIds = [...new Set([...req.avoidIds, ...hints.avoidPlaceIds])];
          req.preferIds = [...new Set([...req.preferIds, ...hints.preferPlaceIds])];
        }
      } else aiInfo.skipped = 'AI_UNAVAILABLE';
    }

    const plan = buildPlan(req, catalog);

    if (wantNarrate && canAi) {
      const intros = await ai.narrate(plan, catalog, now);
      if (intros) {
        plan.days.forEach((d, i) => (d.intro = intros[i]));
        aiInfo.narrated = true;
      } else if (!aiInfo.skipped) aiInfo.skipped = 'AI_UNAVAILABLE';
    }
    return json({ success: true, data: { plan, refs: refsFor(plan, catalog), ai: aiInfo } });
  }

  if (pathname === '/api/admin/itinerary-data' || pathname.startsWith('/api/admin/itinerary-data/')) {
    const user = await deps.requireRole(['admin']);
    if (user instanceof Response) return user;
    const admin = new ItineraryDataAdmin(deps.d1);
    const out = (r: any) => (r.ok ? json({ success: true, data: r.data }) : json({ success: false, code: r.code, error: r.message }, r.status));
    if (pathname === '/api/admin/itinerary-data' && method === 'GET') return out(await admin.list(new URL(request.url).searchParams.get('status')));
    if (method === 'POST') {
      if (!deps.rateLimit(`itin-admin:${user.id}`, 60)) return json({ success: false, code: 'TOO_MANY_REQUESTS', error: 'Thao tác quá nhanh.' }, 429);
      const body = (await deps.readJson(request)) || {};
      if (pathname === '/api/admin/itinerary-data/review') return out(await admin.review(user.id, body));
      const m = pathname.match(/^\/api\/admin\/itinerary-data\/(place|fact)\/([A-Za-z0-9_-]{2,80})$/);
      if (m) return out(await admin.update(user.id, m[1], m[2], body));
    }
    return json({ success: false, code: 'NOT_FOUND', error: 'API endpoint not found' }, 404);
  }
  return null;
}
