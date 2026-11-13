/** R5 — Lịch trình: gọi API dựng lịch và API admin duyệt dữ liệu tham khảo. */
import type { Outcome } from './accountApi.ts';
import type { Budget, CatalogListing, CatalogPlace, Duration, Plan, Style, Transport } from '../itinerary/engine.ts';

const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

async function call<T>(method: string, path: string, body?: unknown): Promise<Outcome<T> & { field?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token()) headers.Authorization = `Bearer ${token()}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, data: data.data as T };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không thực hiện được.', field: data?.field };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export interface PlanInput {
  duration: Duration;
  styles: Style[];
  groupSize: number;
  budget: Budget;
  startDate: string;
  transport: Transport;
  seed: number;
  overrides: Record<string, string | null>;
  avoidIds: string[];
  preferIds: string[];
  note?: string;
  narrate?: boolean;
}

export interface AiHints { styles: Style[]; budget: Budget | null; avoidPlaceIds: string[]; preferPlaceIds: string[] }
export interface PlanResponse {
  plan: Plan;
  refs: { listings: Record<string, CatalogListing>; places: Record<string, CatalogPlace> };
  ai: { available: boolean; hints: AiHints | null; narrated: boolean; skipped: string | null };
}
export interface ItineraryMeta {
  aiAvailable: boolean;
  counts: { homestays: number; restaurants: number; coffees: number; buses: number; busesWithTimes: number; places: number; placesScheduled: number; prices: number };
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'superseded' | 'all';
export interface AdminPlace extends CatalogPlace { status: string; reviewedAt: string | null; reviewNote: string | null }
export interface AdminFact {
  id: string;
  listingId: string;
  listingTitle: string | null;
  listingCategory: string;
  kind: 'price_from' | 'bus_route';
  value: any;
  sources: Array<{ name: string; url: string | null; accessed: string }>;
  status: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}
export interface AdminItineraryData {
  status: ReviewStatus;
  summary: { place: Record<string, number>; fact: Record<string, number> };
  places: AdminPlace[];
  facts: AdminFact[];
}

export const itineraryApi = {
  meta: () => call<ItineraryMeta>('GET', '/api/itinerary/meta'),
  plan: (input: PlanInput) => call<PlanResponse>('POST', '/api/itinerary/plan', input),
  adminList: (status: ReviewStatus) => call<AdminItineraryData>('GET', `/api/admin/itinerary-data?status=${status}`),
  adminReview: (type: 'place' | 'fact', decision: 'approve' | 'reject', ids: string[], note?: string) =>
    call<{ changed: number; unchanged: number }>('POST', '/api/admin/itinerary-data/review', { type, decision, ids, note }),
  adminUpdate: (type: 'place' | 'fact', id: string, patch: Record<string, unknown>) =>
    call<{ id: string; status: string }>('POST', `/api/admin/itinerary-data/${type}/${encodeURIComponent(id)}`, patch),
};
