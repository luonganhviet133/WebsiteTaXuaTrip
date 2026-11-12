/**
 * U2 — Bảng đường dẫn của website. URL là nguồn sự thật cho màn đang xem,
 * nên nút Back, chia sẻ link và tải lại trang đều đúng.
 * File thuần TypeScript (không phụ thuộc React) để test được.
 */
import { parseDeepLinkSearchParams } from '../utils/rules.ts';

export const TAB_PATHS = {
  explore: '/',
  stay: '/luu-tru',
  transport: '/di-chuyen',
  services: '/dich-vu',
  dining: '/an-uong',
  map: '/ban-do',
  weather: '/san-may',
  itinerary: '/lich-trinh',
  community: '/cong-dong',
  verified: '/tham-dinh',
  partner: '/doi-tac',
  admin: '/quan-tri',
} as const;

export type AppTab = keyof typeof TAB_PATHS;

export const LISTING_PREFIX = '/co-so/';
export const MY_TRIPS_PATH = '/chuyen-di-cua-toi';

const TAB_ALIASES: Record<string, AppTab> = { stays: 'stay', bus: 'transport' };
const PATH_TO_TAB = new Map<string, AppTab>(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as AppTab]));

/** Tên tab cũ hoặc lạ → tab hợp lệ. */
export function normalizeTab(tab: string): AppTab {
  if (tab in TAB_PATHS) return tab as AppTab;
  return TAB_ALIASES[tab] || 'explore';
}

export function pathForTab(tab: string): string {
  return TAB_PATHS[normalizeTab(tab)];
}

export function listingPath(id: string): string {
  return `${LISTING_PREFIX}${encodeURIComponent(id)}`;
}

export interface RouteQuery {
  checkIn?: string;
  checkOut?: string;
  area?: string;
  wishlistIds?: string[];
}

export interface ParsedRoute {
  /** Có khi đường dẫn là một màn; không có khi là trang chi tiết (giữ màn nền đang xem). */
  tab?: AppTab;
  listingId?: string;
  myTrips?: boolean;
  notFound?: boolean;
  query: RouteQuery;
  /** Link kiểu cũ (?tab=…&listing=…) cần chuyển sang đường dẫn mới. */
  redirectTo?: string;
}

/** Bộ lọc giữ trong query string để tải lại/chia sẻ vẫn còn. */
export function buildQuery(q: RouteQuery): string {
  const sp = new URLSearchParams();
  if (q.checkIn) sp.set('checkin', q.checkIn);
  if (q.checkOut) sp.set('checkout', q.checkOut);
  if (q.area && q.area !== 'all') sp.set('area', q.area);
  if (q.wishlistIds && q.wishlistIds.length) sp.set('wishlist', q.wishlistIds.join(','));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function parseLocation(pathname: string, search: string): ParsedRoute {
  const legacy = parseDeepLinkSearchParams(search);
  const query: RouteQuery = {
    checkIn: legacy.checkIn,
    checkOut: legacy.checkOut,
    area: legacy.area,
    wishlistIds: legacy.wishlistIds,
  };
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (legacy.listingId || legacy.tab) {
    const target = legacy.listingId ? listingPath(legacy.listingId) : pathForTab(legacy.tab!);
    return { query, redirectTo: `${target}${buildQuery(query)}` };
  }

  if (path.startsWith(LISTING_PREFIX)) {
    const id = decodeURIComponent(path.slice(LISTING_PREFIX.length));
    if (!id || id.includes('/')) return { tab: 'explore', notFound: true, query };
    return { listingId: id, query };
  }
  if (path === MY_TRIPS_PATH) return { myTrips: true, query };

  const tab = PATH_TO_TAB.get(path === '' ? '/' : path);
  if (tab) return { tab, query };
  return { tab: 'explore', notFound: true, query };
}
