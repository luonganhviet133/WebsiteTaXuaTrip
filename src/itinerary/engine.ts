/**
 * R5 — Bộ dựng lịch trình Tà Xùa theo quy tắc (dùng chung server và giao diện, không phụ thuộc Node).
 *
 * Nguyên tắc:
 *  - Chỉ dùng cơ sở/điểm có trong catalog (đã duyệt). Không bịa tên, giờ hay giá.
 *  - Giờ bình minh/hoàng hôn, thời gian di chuyển giữa hai điểm là ước tính → item.approx = true để giao diện ghi "khoảng".
 *  - Điểm chưa có thời gian đi từ trung tâm không được tự xếp giờ; chỉ hiện ở "Gợi ý thêm".
 *  - Chi phí chỉ cộng từ giá đã duyệt; phần chưa có giá liệt kê riêng, không ước đoán.
 *  - Cùng request + seed + overrides → cùng kết quả (để "Đổi" một điểm không làm xáo cả lịch).
 */

export const DURATIONS = { '2N1D': { days: 2, nights: 1, label: '2 ngày 1 đêm' }, '3N2D': { days: 3, nights: 2, label: '3 ngày 2 đêm' }, '4N3D': { days: 4, nights: 3, label: '4 ngày 3 đêm' } } as const;
export const STYLES = { 'san-may': 'Săn mây', chill: 'Nghỉ dưỡng, thong thả', 'kham-pha': 'Khám phá, trekking', 'chup-anh': 'Chụp ảnh, check-in' } as const;
export const BUDGETS = { 'tiet-kiem': 'Tiết kiệm', vua: 'Vừa phải', 'thoai-mai': 'Thoải mái' } as const;
export const TRANSPORTS = { 'xe-khach': 'Xe khách từ Hà Nội', 'tu-tuc': 'Tự đi (xe máy, ô tô)' } as const;

export type Duration = keyof typeof DURATIONS;
export type Style = keyof typeof STYLES;
export type Budget = keyof typeof BUDGETS;
export type Transport = keyof typeof TRANSPORTS;
export type TimeOfDay = 'sunrise' | 'morning' | 'afternoon' | 'sunset';

/** Giá phòng "từ" để xếp mức ngân sách (VNĐ/phòng/đêm). Chỉ áp dụng khi cơ sở có giá đã duyệt. */
export const BUDGET_BANDS: Record<Budget, [number, number]> = { 'tiet-kiem': [0, 600_000], vua: [400_000, 1_300_000], 'thoai-mai': [900_000, Number.MAX_SAFE_INTEGER] };
export const MAX_GROUP = 30;
export const CLOUD_SEASON_MONTHS = [10, 11, 12, 1, 2, 3, 4];

export interface PlanRequest {
  duration: Duration;
  styles: Style[];
  groupSize: number;
  budget: Budget;
  startDate: string; // YYYY-MM-DD
  transport: Transport;
  seed: number;
  /** slotKey → id thay thế; null = bỏ điểm ở khung đó. */
  overrides: Record<string, string | null>;
  avoidIds: string[];
  /** Điểm khách muốn đi (ưu tiên xếp nếu hợp khung giờ). */
  preferIds: string[];
}

export interface BusRoute {
  outbound: { from: string; departures: string[]; pickup: string | null } | null;
  inbound: { to: string; departures: string[] } | null;
  durationMinutes: number | null;
  priceFromVnd: number | null;
  priceToVnd: number | null;
  priceUnit: 'lượt' | 'khứ hồi' | null;
  vehicles?: string | null;
  notes?: string;
}

export interface Price { amountVnd: number; unit: string; notes?: string }
export interface SourceRef { name: string; url: string | null; accessed: string }

export interface CatalogListing {
  id: string;
  category: 'homestay' | 'restaurant' | 'coffee' | 'bus' | 'tour' | 'photo';
  title: string;
  area: string;
  phone: string;
  zalo: string;
  coverImage: string;
  tags: string[];
  hasCloudView: boolean;
  verificationTier: 1 | 2 | 3;
  featured: boolean;
  price: (Price & { sources: SourceRef[] }) | null;
  bus: (BusRoute & { sources: SourceRef[] }) | null;
}

export interface CatalogPlace {
  id: string;
  name: string;
  kind: 'viewpoint' | 'trek' | 'village' | 'nature';
  area: string;
  summary: string;
  bestTimes: TimeOfDay[];
  styles: Style[];
  visitMinutes: number;
  travelMinutes: number | null;
  distanceKm: number | null;
  entryFeeVnd: number | null;
  parkingFeeVnd: number | null;
  difficulty: 'de' | 'trung-binh' | 'kho' | null;
  bestMonths: number[];
  notes: string | null;
  coverImage: string | null;
  sources: SourceRef[];
}

export interface Catalog { listings: CatalogListing[]; places: CatalogPlace[] }

export type ItemKind = 'transport' | 'stay' | 'place' | 'meal' | 'coffee' | 'rest' | 'free';
export interface PlanItem {
  slotKey: string | null; // null = không đổi được
  kind: ItemKind;
  start: string; // HH:MM
  end: string | null;
  approx: boolean;
  title: string;
  detail: string | null;
  travelMinutes: number | null;
  ref: { type: 'listing' | 'place'; id: string } | null;
  alternatives: string[];
  previousNight?: boolean;
}
export interface PlanDay { index: number; date: string; weekday: string; title: string; items: PlanItem[]; intro: string | null }
export interface CostLine { label: string; minVnd: number; maxVnd: number; basis: string }
export interface CostSummary { lines: CostLine[]; totalMinVnd: number; totalMaxVnd: number; perPersonMinVnd: number; perPersonMaxVnd: number; unknown: string[] }
export interface Plan {
  request: PlanRequest;
  title: string;
  days: PlanDay[];
  stay: { listingId: string | null; alternatives: string[]; rooms: number; nights: number };
  bus: { outboundListingId: string | null; inboundListingId: string | null; alternatives: string[] };
  cost: CostSummary;
  extras: string[]; // place id chưa đủ dữ liệu để xếp giờ
  notes: string[];
  dataGaps: string[];
}

// ---------- tiện ích thời gian ----------
const SUN: Record<number, [string, string]> = {
  1: ['06:45', '17:35'], 2: ['06:40', '17:55'], 3: ['06:20', '18:10'], 4: ['05:55', '18:20'], 5: ['05:40', '18:35'], 6: ['05:35', '18:45'],
  7: ['05:45', '18:45'], 8: ['05:55', '18:30'], 9: ['06:00', '18:05'], 10: ['06:10', '17:40'], 11: ['06:25', '17:20'], 12: ['06:40', '17:20'],
};
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const fmt = (min: number) => {
  const m = ((Math.round(min / 5) * 5) % 1440 + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}
export const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

// ---------- ngẫu nhiên có hạt giống (mulberry32) ----------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- kiểm tra request ----------
export type ParseResult = { ok: true; value: PlanRequest } | { ok: false; field: string; message: string };
export function parsePlanRequest(raw: any, today = new Date()): ParseResult {
  const r = raw && typeof raw === 'object' ? raw : {};
  if (!(r.duration in DURATIONS)) return { ok: false, field: 'duration', message: 'Chọn 2N1Đ, 3N2Đ hoặc 4N3Đ.' };
  const styles = Array.isArray(r.styles) ? [...new Set(r.styles.filter((s: any) => s in STYLES))] as Style[] : [];
  if (!styles.length || styles.length > 4) return { ok: false, field: 'styles', message: 'Chọn ít nhất một phong cách chuyến đi.' };
  const groupSize = Number(r.groupSize);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > MAX_GROUP) return { ok: false, field: 'groupSize', message: `Số người từ 1 đến ${MAX_GROUP}.` };
  if (!(r.budget in BUDGETS)) return { ok: false, field: 'budget', message: 'Chọn mức ngân sách.' };
  if (!(r.transport in TRANSPORTS)) return { ok: false, field: 'transport', message: 'Chọn cách di chuyển.' };
  if (typeof r.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.startDate) || Number.isNaN(Date.parse(`${r.startDate}T00:00:00Z`))) {
    return { ok: false, field: 'startDate', message: 'Ngày đi không hợp lệ.' };
  }
  const todayIso = today.toISOString().slice(0, 10);
  const maxIso = addDays(todayIso, 365).toISOString().slice(0, 10);
  if (r.startDate < todayIso || r.startDate > maxIso) return { ok: false, field: 'startDate', message: 'Ngày đi trong vòng 12 tháng tới.' };
  const seed = Number.isInteger(r.seed) && r.seed >= 0 && r.seed < 2 ** 31 ? r.seed : 1;
  const overrides: Record<string, string | null> = {};
  if (r.overrides && typeof r.overrides === 'object') {
    for (const [k, v] of Object.entries(r.overrides).slice(0, 60)) {
      if (!/^[a-z0-9-]{2,40}$/.test(k)) continue;
      if (v === null || (typeof v === 'string' && /^[a-zA-Z0-9_-]{2,60}$/.test(v))) overrides[k] = v as string | null;
    }
  }
  const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x: any) => typeof x === 'string' && /^[a-zA-Z0-9_-]{2,60}$/.test(x)))].slice(0, 40) as string[] : []);
  return { ok: true, value: { duration: r.duration, styles, groupSize, budget: r.budget, startDate: r.startDate, transport: r.transport, seed, overrides, avoidIds: ids(r.avoidIds), preferIds: ids(r.preferIds) } };
}

// ---------- bộ dựng ----------
interface Ctx {
  req: PlanRequest;
  month: number;
  rand: () => number;
  listings: Map<string, CatalogListing>;
  places: Map<string, CatalogPlace>;
  usedPlaces: Set<string>;
  usedListings: Map<string, number>;
  notes: Set<string>;
}

const styleHits = (styles: Style[], want: Style[]) => styles.filter((s) => want.includes(s)).length;

function choose<T extends { id: string }>(ctx: Ctx, slotKey: string, pool: T[], score: (x: T) => number, take = 4): { pick: T | null; alternatives: string[]; removed: boolean } {
  const ranked = pool
    .filter((x) => !ctx.req.avoidIds.includes(x.id))
    .map((x) => ({ x, s: score(x) + ctx.rand() * 0.9 }))
    .filter((r) => r.s > -50)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.x);
  if (slotKey in ctx.req.overrides) {
    const want = ctx.req.overrides[slotKey];
    if (want === null) return { pick: null, alternatives: ranked.slice(0, take).map((x) => x.id), removed: true };
    const found = pool.find((x) => x.id === want);
    if (found) return { pick: found, alternatives: ranked.filter((x) => x.id !== found.id).slice(0, take).map((x) => x.id), removed: false };
  }
  const pick = ranked[0] ?? null;
  return { pick, alternatives: ranked.slice(1, take + 1).map((x) => x.id), removed: false };
}

function placeScore(ctx: Ctx, p: CatalogPlace, time: TimeOfDay, opts: { maxTravel?: number } = {}) {
  if (p.travelMinutes === null) return -100;
  if (ctx.usedPlaces.has(p.id)) return -100;
  if (!p.bestTimes.includes(time)) return -100;
  if (opts.maxTravel !== undefined && p.travelMinutes > opts.maxTravel) return -100;
  let s = styleHits(p.styles, ctx.req.styles) * 3;
  if (ctx.req.preferIds.includes(p.id)) s += 8;
  if (p.bestMonths.length && p.bestMonths.includes(ctx.month)) s += 2;
  if (p.bestMonths.length && !p.bestMonths.includes(ctx.month)) s -= 1;
  if (p.difficulty === 'kho' && !ctx.req.styles.includes('kham-pha') && !ctx.req.styles.includes('san-may')) s -= 4;
  if (p.difficulty === 'kho' && ctx.req.groupSize >= 10) s -= 1;
  return s;
}

function listingScore(ctx: Ctx, l: CatalogListing, prefer: { area?: string; cloud?: boolean } = {}) {
  let s = (l.verificationTier - 1) * 4 + (l.featured ? 2 : 0);
  s -= (ctx.usedListings.get(l.id) ?? 0) * 6; // hạn chế ăn lặp một quán
  if (prefer.area && l.area && l.area === prefer.area) s += 1.5;
  if (prefer.cloud && l.hasCloudView) s += 2;
  if (l.price) s += 0.5;
  return s;
}

function homestayScore(ctx: Ctx, l: CatalogListing) {
  let s = listingScore(ctx, l, { cloud: ctx.req.styles.includes('san-may') });
  if (l.price && /phòng/.test(l.price.unit)) {
    const [lo, hi] = BUDGET_BANDS[ctx.req.budget];
    s += l.price.amountVnd >= lo && l.price.amountVnd <= hi ? 3 : -4;
  }
  return s;
}

function travelBetween(a: CatalogPlace | null, b: CatalogPlace): number {
  if (b.travelMinutes === null) return 30;
  if (!a || a.travelMinutes === null) return b.travelMinutes;
  if (a.area === b.area) return Math.max(10, Math.abs(a.travelMinutes - b.travelMinutes) + 5);
  return a.travelMinutes + b.travelMinutes;
}

export function buildPlan(req: PlanRequest, catalog: Catalog): Plan {
  const { days: nDays, nights, label } = DURATIONS[req.duration];
  const month = Number(req.startDate.slice(5, 7));
  const ctx: Ctx = {
    req, month, rand: rng(req.seed * 2654435761 + nDays),
    listings: new Map(catalog.listings.map((l) => [l.id, l])),
    places: new Map(catalog.places.map((p) => [p.id, p])),
    usedPlaces: new Set(), usedListings: new Map(), notes: new Set(),
  };
  const byCat = (c: CatalogListing['category']) => catalog.listings.filter((l) => l.category === c);
  const [sunrise, sunset] = SUN[month].map(toMin);
  const dataGaps: string[] = [];

  // ---- chỗ ở ----
  const stayPick = choose(ctx, 'stay', byCat('homestay'), (l) => homestayScore(ctx, l), 6);
  const stay = stayPick.pick;
  const stayArea = stay?.area || 'Trung Tâm Tà Xùa';
  const rooms = Math.ceil(req.groupSize / 2);

  // ---- xe ----
  const buses = byCat('bus');
  const withOut = buses.filter((b) => b.bus?.outbound?.departures.length);
  const withIn = buses.filter((b) => b.bus?.inbound?.departures.length);
  let busOut: CatalogListing | null = null;
  let busIn: CatalogListing | null = null;
  let busAlternatives: string[] = [];
  let returnWithOutbound = false;
  if (req.transport === 'xe-khach') {
    const night = (b: CatalogListing) => (b.bus?.outbound?.departures ?? []).some((d) => toMin(d) >= 19 * 60);
    const both = (b: CatalogListing) => !!b.bus?.inbound?.departures.length;
    const o = choose(ctx, 'bus-out', withOut, (b) => listingScore(ctx, b) + (night(b) && req.styles.includes('san-may') ? 3 : 0) + (both(b) ? 2 : 0), 5);
    busOut = o.pick;
    // Vé khứ hồi mà chưa có giờ chiều về → về cùng nhà xe đó (gọi chốt giờ), không ghép nhà xe khác.
    returnWithOutbound = !!busOut && busOut.bus?.priceUnit === 'khứ hồi' && !both(busOut) && !('bus-in' in req.overrides);
    if (!returnWithOutbound) {
      const i = choose(ctx, 'bus-in', withIn, (b) => listingScore(ctx, b) + (b.id === busOut?.id ? 3 : 0), 5);
      busIn = i.pick;
    }
    busAlternatives = buses.filter((b) => b.id !== busOut?.id && b.id !== busIn?.id).map((b) => b.id);
    if (!withOut.length) dataGaps.push('Chưa có giờ chạy xe Hà Nội → Tà Xùa đã duyệt: lịch ngày đầu tính từ lúc tới nơi; gọi nhà xe để chốt giờ.');
    if (!withIn.length && !returnWithOutbound) dataGaps.push('Chưa có giờ xe chiều về đã duyệt: gọi nhà xe để chốt giờ về.');
  }

  // ---- giờ đến ngày đầu ----
  let arrive = 11 * 60 + 30;
  let arrivalApprox = true;
  const firstItems: PlanItem[] = [];
  const outDeps = (busOut?.bus?.outbound?.departures ?? []).map(toMin).sort((a, b) => a - b);
  const busDuration = busOut?.bus?.durationMinutes ?? 300;
  if (req.transport === 'xe-khach' && busOut && outDeps.length) {
    const nightDep = outDeps.find((d) => d >= 19 * 60);
    const dayDep = outDeps.find((d) => d < 12 * 60);
    const useNight = nightDep !== undefined && (req.styles.includes('san-may') || dayDep === undefined);
    const dep = useNight ? nightDep! : (dayDep ?? outDeps[0]);
    arrive = (dep + busDuration) % 1440;
    firstItems.push({
      slotKey: 'bus-out', kind: 'transport', start: fmt(dep), end: null, approx: false, previousNight: useNight,
      title: `Xe ${busOut.title} từ ${busOut.bus!.outbound!.from}`,
      detail: [busOut.bus!.outbound!.pickup ? `Đón: ${busOut.bus!.outbound!.pickup}` : null, `Khoảng ${Math.round(busDuration / 60)} tiếng`, 'Gọi nhà xe giữ chỗ trước'].filter(Boolean).join(' · '),
      travelMinutes: null, ref: { type: 'listing', id: busOut.id }, alternatives: withOut.filter((b) => b.id !== busOut!.id).map((b) => b.id),
    });
    arrivalApprox = true;
  } else if (req.transport === 'xe-khach') {
    firstItems.push({
      slotKey: null, kind: 'transport', start: fmt(arrive - 300), end: null, approx: true, title: 'Đi xe khách Hà Nội → Tà Xùa',
      detail: 'Chưa có giờ chạy đã kiểm. Quãng đường khoảng 240 km, xe đi khoảng 5 tiếng; gọi một nhà xe trong danh sách để chốt giờ.',
      travelMinutes: null, ref: null, alternatives: buses.map((b) => b.id).slice(0, 6),
    });
  } else {
    firstItems.push({
      slotKey: null, kind: 'transport', start: '06:00', end: fmt(arrive), approx: true, title: 'Tự đi Hà Nội → Tà Xùa',
      detail: 'Khoảng 240 km, đường đèo nhiều cua ở chặng Bắc Yên – Tà Xùa; nên tới nơi trước khi trời tối.',
      travelMinutes: null, ref: null, alternatives: [],
    });
  }

  // ---- từng ngày ----
  const daysOut: PlanDay[] = [];
  const eat = (slotKey: string, at: number, kind: 'meal' | 'coffee', label: string, prefer: { area?: string; cloud?: boolean }): PlanItem | null => {
    const pool = kind === 'meal' ? byCat('restaurant') : byCat('coffee');
    const c = choose(ctx, slotKey, pool, (l) => listingScore(ctx, l, prefer), 4);
    if (c.removed) return null;
    if (!c.pick) {
      return { slotKey: null, kind, start: fmt(at), end: null, approx: false, title: label, detail: kind === 'meal' ? 'Ăn tại homestay hoặc quán gần nơi ở' : null, travelMinutes: null, ref: null, alternatives: [] };
    }
    ctx.usedListings.set(c.pick.id, (ctx.usedListings.get(c.pick.id) ?? 0) + 1);
    return {
      slotKey, kind, start: fmt(at), end: null, approx: false, title: `${label}: ${c.pick.title}`,
      detail: c.pick.area || null,
      travelMinutes: null, ref: { type: 'listing', id: c.pick.id }, alternatives: c.alternatives,
    };
  };

  let lastPlace: CatalogPlace | null = null;
  /** startIsArrival: startAt là giờ có mặt (bình minh/hoàng hôn); notBefore: không được xuất phát trước mốc này. */
  const visit = (slotKey: string, time: TimeOfDay, startAt: number, opts: { maxTravel?: number; startIsArrival?: boolean; notBefore?: number } = {}): { item: PlanItem | null; endAt: number; back: number } => {
    const c = choose(ctx, slotKey, catalog.places, (p) => placeScore(ctx, p, time, opts), 4);
    if (c.removed || !c.pick || c.pick.travelMinutes === null) return { item: null, endAt: startAt, back: 0 };
    const p = c.pick;
    const travel = travelBetween(lastPlace, p);
    const begin = opts.startIsArrival ? startAt : startAt + travel;
    const leave = opts.startIsArrival ? startAt - travel : startAt;
    if (opts.notBefore !== undefined && leave < opts.notBefore) return { item: null, endAt: startAt, back: 0 };
    ctx.usedPlaces.add(p.id);
    lastPlace = p;
    const fee = p.entryFeeVnd ? `vé ${formatVnd(p.entryFeeVnd)}/người` : null;
    return {
      item: {
        slotKey, kind: 'place', start: fmt(begin), end: fmt(begin + p.visitMinutes), approx: true, title: p.name,
        detail: [p.summary, fee, opts.startIsArrival ? `xuất phát khoảng ${fmt(leave)}` : null].filter(Boolean).join(' · '),
        travelMinutes: travel, ref: { type: 'place', id: p.id }, alternatives: c.alternatives,
      },
      endAt: begin + p.visitMinutes,
      back: p.travelMinutes ?? 0,
    };
  };

  const returnDeps = (busIn?.bus?.inbound?.departures ?? []).map(toMin).sort((a, b) => a - b);

  for (let d = 0; d < nDays; d++) {
    const date = addDays(req.startDate, d);
    const iso = date.toISOString().slice(0, 10);
    const items: PlanItem[] = [];
    const isFirst = d === 0;
    const isLast = d === nDays - 1;
    lastPlace = null;
    const k = (s: string) => `d${d + 1}-${s}`;
    let t: number;
    let napped = false;

    if (isFirst) {
      items.push(...firstItems);
      const arrivedEarly = arrive < sunrise - 30 && arrive > 0 && arrive < 10 * 60;
      items.push({
        slotKey: 'stay', kind: 'stay', start: fmt(arrive), end: null, approx: arrivalApprox,
        title: stay ? `Tới Tà Xùa, gửi đồ tại ${stay.title}` : 'Tới Tà Xùa, nhận chỗ nghỉ',
        detail: arrivedEarly ? 'Xe đêm thường tới khi trời còn tối — hỏi trước homestay có cho nhận phòng sớm không.' : stay ? stay.area : null,
        travelMinutes: null, ref: stay ? { type: 'listing', id: stay.id } : null, alternatives: stayPick.alternatives,
      });
      if (arrivedEarly) {
        const sr = visit(k('sunrise'), 'sunrise', sunrise - 15, { maxTravel: 15, startIsArrival: true, notBefore: arrive });
        if (sr.item) items.push(sr.item);
        t = Math.max(sr.endAt + sr.back, sunrise + 60);
        const bf = eat(k('breakfast'), t + 10, 'coffee', 'Ăn sáng, cà phê ngắm mây', { cloud: true });
        if (bf) items.push(bf);
        items.push({ slotKey: null, kind: 'rest', start: fmt(t + 70), end: '11:30', approx: false, title: 'Nghỉ ngơi bù giấc sau chuyến xe đêm', detail: null, travelMinutes: null, ref: null, alternatives: [] });
        napped = true;
        t = 11 * 60 + 30;
      } else {
        t = Math.max(arrive + 30, 11 * 60 + 30);
      }
    } else {
      const sr = visit(k('sunrise'), 'sunrise', sunrise - 15, { startIsArrival: true, notBefore: 4 * 60 });
      if (sr.item) items.push(sr.item);
      t = Math.max(sr.endAt + sr.back, sunrise + 45);
      const bf = eat(k('breakfast'), t + 15, 'coffee', 'Ăn sáng, cà phê', { cloud: true, area: stayArea });
      if (bf) items.push(bf);
      t += 75;
      if (!isLast) {
        lastPlace = null;
        const mo = visit(k('morning'), 'morning', t);
        if (mo.item) {
          items.push(mo.item);
          t = mo.endAt;
        } else if (ctx.req.styles.includes('chill')) {
          items.push({ slotKey: null, kind: 'free', start: fmt(t), end: '11:30', approx: false, title: 'Thong thả tại homestay', detail: null, travelMinutes: null, ref: null, alternatives: [] });
        }
        t = Math.max(t + 20, 11 * 60 + 30);
      }
    }

    if (isLast && !isFirst) {
      // Ngày cuối dựng ngược từ giờ xe về: ăn trưa xong trước giờ xe ≥ 20 phút.
      const inbound = returnDeps.find((x) => x >= t + 90) ?? returnDeps[returnDeps.length - 1];
      const hasBus = req.transport === 'xe-khach' && !!busIn && inbound !== undefined && inbound > t;
      const lunchAt = hasBus ? Math.min(Math.max(t, 11 * 60), inbound - 80) : Math.max(t, 11 * 60 + 15);
      if (lunchAt >= t) {
        const lu = eat(k('lunch'), lunchAt, 'meal', 'Ăn trưa', { area: stayArea });
        if (lu) items.push(lu);
      }
      const checkout = hasBus ? Math.max(t, inbound - 25) : Math.max(t, lunchAt + 60);
      items.push({ slotKey: null, kind: 'stay', start: fmt(checkout), end: null, approx: false, title: 'Trả phòng', detail: null, travelMinutes: null, ref: stay ? { type: 'listing', id: stay.id } : null, alternatives: [] });
      if (hasBus && busIn) {
        items.push({
          slotKey: 'bus-in', kind: 'transport', start: fmt(inbound!), end: null, approx: false, title: `Xe ${busIn.title} về ${busIn.bus!.inbound!.to}`,
          detail: `Các giờ khác: ${busIn.bus!.inbound!.departures.join(', ')} · gọi nhà xe giữ chỗ`, travelMinutes: null, ref: { type: 'listing', id: busIn.id },
          alternatives: withIn.filter((b) => b.id !== busIn!.id).map((b) => b.id),
        });
      } else {
        const same = returnWithOutbound && busOut;
        items.push({
          slotKey: null, kind: 'transport', start: fmt(checkout + 30), end: null, approx: true,
          title: req.transport === 'xe-khach' ? (same ? `Xe ${busOut!.title} về Hà Nội` : 'Xe về Hà Nội') : 'Lên đường về Hà Nội',
          detail: req.transport === 'xe-khach' ? (same ? 'Vé khứ hồi: gọi nhà xe chốt giờ chiều về.' : 'Gọi nhà xe để chốt giờ về.') : 'Khoảng 240 km; nên rời Tà Xùa trước 14h để qua đoạn đèo khi trời còn sáng.',
          travelMinutes: null, ref: same ? { type: 'listing', id: busOut!.id } : null, alternatives: req.transport === 'xe-khach' && !same ? buses.map((b) => b.id).slice(0, 6) : [],
        });
      }
    } else {
      const lu = eat(k('lunch'), t, 'meal', 'Ăn trưa', { area: stayArea });
      if (lu) items.push(lu);
      t += 75;
      if ((ctx.req.styles.includes('chill') || isFirst) && !napped) {
        items.push({ slotKey: null, kind: 'rest', start: fmt(t), end: fmt(t + 75), approx: false, title: 'Nghỉ trưa', detail: null, travelMinutes: null, ref: null, alternatives: [] });
        t += 75;
      }
      lastPlace = null;
      const af = visit(k('afternoon'), 'afternoon', t);
      if (af.item) {
        items.push(af.item);
        t = af.endAt;
        if (t < sunset - 120) {
          const af2 = visit(k('afternoon2'), 'afternoon', t);
          if (af2.item && af2.endAt <= sunset - 30) {
            items.push(af2.item);
            t = af2.endAt;
          } else if (af2.item) {
            ctx.usedPlaces.delete(af2.item.ref!.id);
          }
        }
      } else {
        const tea = eat(k('afternoon-coffee'), t, 'coffee', 'Cà phê chiều', { cloud: true });
        if (tea) items.push(tea);
        t += 60;
      }
      const ss = visit(k('sunset'), 'sunset', sunset - 30, { startIsArrival: true, notBefore: t });
      if (ss.item) items.push(ss.item);
      const di = eat(k('dinner'), Math.max(ss.item ? ss.endAt + ss.back + 15 : sunset + 30, 18 * 60 + 30), 'meal', 'Ăn tối', { area: stayArea });
      if (di) items.push(di);
    }

    const titleParts = items.filter((i) => i.kind === 'place').map((i) => i.title);
    daysOut.push({
      index: d + 1, date: iso, weekday: WEEKDAYS[date.getUTCDay()],
      title: titleParts.length ? titleParts.slice(0, 2).join(' · ') : isFirst ? 'Lên Tà Xùa' : isLast ? 'Về Hà Nội' : 'Thong thả Tà Xùa',
      items, intro: null,
    });
  }

  // ---- gợi ý thêm & ghi chú ----
  const extras = catalog.places.filter((p) => !ctx.usedPlaces.has(p.id) && !req.avoidIds.includes(p.id)).map((p) => p.id);
  const notes: string[] = [];
  if (!CLOUD_SEASON_MONTHS.includes(month) && req.styles.includes('san-may')) notes.push('Ngày đi nằm ngoài mùa mây thường gặp (tháng 10 – tháng 4): vẫn có thể có mây nhưng khả năng thấp hơn.');
  notes.push('Giờ bình minh, hoàng hôn và thời gian di chuyển giữa các điểm là ước tính; hỏi homestay về thời tiết và đường đi trước khi xuất phát.');
  if (catalog.places.some((p) => p.difficulty === 'kho' && ctx.usedPlaces.has(p.id))) notes.push('Có điểm đường khó: nếu tay lái chưa vững, thuê xe ôm người địa phương.');
  if (!catalog.places.length) dataGaps.push('Chưa có điểm tham quan nào được duyệt — lịch chỉ gồm chỗ ở, ăn uống và cà phê.');
  if (!stay) dataGaps.push('Chưa có homestay phù hợp trong danh bạ.');

  const plan: Plan = {
    request: req,
    title: `Tà Xùa ${label}`,
    days: daysOut,
    stay: { listingId: stay?.id ?? null, alternatives: stayPick.alternatives, rooms, nights },
    bus: { outboundListingId: busOut?.id ?? null, inboundListingId: busIn?.id ?? null, alternatives: busAlternatives },
    cost: { lines: [], totalMinVnd: 0, totalMaxVnd: 0, perPersonMinVnd: 0, perPersonMaxVnd: 0, unknown: [] },
    extras, notes, dataGaps,
  };
  plan.cost = computeCost(plan, catalog);
  return plan;
}

/** Chi phí chỉ từ giá đã duyệt; phần thiếu giá liệt kê trong `unknown`. */
export function computeCost(plan: Plan, catalog: Catalog): CostSummary {
  const L = new Map(catalog.listings.map((l) => [l.id, l]));
  const P = new Map(catalog.places.map((p) => [p.id, p]));
  const people = plan.request.groupSize;
  const lines: CostLine[] = [];
  const unknown = new Set<string>();

  const stay = plan.stay.listingId ? L.get(plan.stay.listingId) : null;
  if (stay?.price) {
    const perRoom = /phòng/.test(stay.price.unit);
    const qty = (perRoom ? plan.stay.rooms : people) * plan.stay.nights;
    lines.push({ label: `Chỗ ở: ${stay.title}`, minVnd: stay.price.amountVnd * qty, maxVnd: stay.price.amountVnd * qty, basis: `giá từ ${formatVnd(stay.price.amountVnd)}/${stay.price.unit} × ${perRoom ? `${plan.stay.rooms} phòng` : `${people} người`} × ${plan.stay.nights} đêm` });
  } else if (stay) unknown.add(`Chỗ ở (${stay.title}) — hỏi giá`);

  const busIds = [...new Set([plan.bus.outboundListingId, plan.bus.inboundListingId].filter(Boolean) as string[])];
  if (plan.request.transport === 'xe-khach') {
    if (!busIds.length) unknown.add('Vé xe khứ hồi — hỏi nhà xe');
    for (const id of busIds) {
      const b = L.get(id);
      if (!b?.bus?.priceFromVnd) {
        unknown.add(`Vé xe ${b?.title ?? ''} — hỏi nhà xe`.trim());
        continue;
      }
      const legs = b.bus.priceUnit === 'khứ hồi' ? 1 : busIds.length === 1 ? 2 : 1;
      const lo = b.bus.priceFromVnd * people * legs;
      const hi = (b.bus.priceToVnd ?? b.bus.priceFromVnd) * people * legs;
      lines.push({ label: `Xe: ${b.title}`, minVnd: lo, maxVnd: hi, basis: `${formatVnd(b.bus.priceFromVnd)}${b.bus.priceToVnd ? `–${formatVnd(b.bus.priceToVnd)}` : ''}/${b.bus.priceUnit} × ${people} người${legs === 2 ? ' × 2 chiều' : ''}` });
    }
  } else unknown.add('Xăng xe, phí cầu đường (tự đi)');

  let fees = 0;
  const feeNames: string[] = [];
  const mealCounts = new Map<string, number>();
  for (const day of plan.days) {
    for (const it of day.items) {
      if (!it.ref) continue;
      if (it.ref.type === 'place') {
        const p = P.get(it.ref.id);
        if (p?.entryFeeVnd) {
          fees += p.entryFeeVnd * people;
          feeNames.push(p.name);
        }
        if (p?.parkingFeeVnd) unknown.add(`Gửi xe tại ${p.name} (${formatVnd(p.parkingFeeVnd)}/xe)`);
      } else if (it.kind === 'meal' || it.kind === 'coffee') {
        mealCounts.set(it.ref.id, (mealCounts.get(it.ref.id) ?? 0) + 1);
      }
    }
  }
  if (fees) lines.push({ label: 'Vé tham quan', minVnd: fees, maxVnd: fees, basis: `${feeNames.join(', ')} × ${people} người` });

  let food = 0;
  let foodMissing = 0;
  for (const [id, n] of mealCounts) {
    const l = L.get(id);
    if (l?.price && /người/.test(l.price.unit)) food += l.price.amountVnd * people * n;
    else foodMissing += n;
  }
  if (food) lines.push({ label: 'Ăn uống (quán có giá)', minVnd: food, maxVnd: food, basis: 'giá "từ" của quán × số người × số bữa' });
  if (foodMissing) unknown.add(`${foodMissing} bữa ăn/cà phê chưa có giá`);
  unknown.add('Xe ôm, thuê xe máy tại chỗ');

  const totalMinVnd = lines.reduce((s, l) => s + l.minVnd, 0);
  const totalMaxVnd = lines.reduce((s, l) => s + l.maxVnd, 0);
  return { lines, totalMinVnd, totalMaxVnd, perPersonMinVnd: Math.round(totalMinVnd / people), perPersonMaxVnd: Math.round(totalMaxVnd / people), unknown: [...unknown] };
}

/** Tên mọi cơ sở/điểm có trong lịch — dùng để kiểm lời dẫn AI không nhắc nơi ngoài lịch. */
export function namesInPlan(plan: Plan, catalog: Catalog): Set<string> {
  const L = new Map(catalog.listings.map((l) => [l.id, l.title]));
  const P = new Map(catalog.places.map((p) => [p.id, p.name]));
  const out = new Set<string>();
  for (const d of plan.days) for (const it of d.items) if (it.ref) out.add((it.ref.type === 'listing' ? L.get(it.ref.id) : P.get(it.ref.id)) ?? '');
  out.delete('');
  return out;
}
