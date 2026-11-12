/**
 * N04.1 — Lựa chọn tìm kiếm của khách (ngày, khách, phòng, khu vực) dùng chung từ trang chủ,
 * danh sách, chi tiết tới báo giá. Ngày tính theo giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7, không đổi giờ).
 */
export interface SearchIntent {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  area: string;
}

export const MAX_NIGHTS = 30;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayInVietnam(now: Date = new Date()): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ngày dạng YYYY-MM-DD có thật (loại 2026-02-30). */
export function isValidIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000);
}

export function defaultStayDates(now: Date = new Date()): { checkIn: string; checkOut: string } {
  const checkIn = addDays(todayInVietnam(now), 1);
  return { checkIn, checkOut: addDays(checkIn, 1) };
}

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
};

export function normalizeSearchIntent(input: Partial<Record<keyof SearchIntent, unknown>>, now: Date = new Date()): SearchIntent {
  const today = todayInVietnam(now);
  const defaults = defaultStayDates(now);
  let checkIn = isValidIsoDate(input.checkIn) && input.checkIn >= today ? input.checkIn : defaults.checkIn;
  let checkOut = isValidIsoDate(input.checkOut) ? input.checkOut : addDays(checkIn, 1);
  if (checkIn === defaults.checkIn && input.checkIn !== defaults.checkIn) checkOut = defaults.checkOut;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) checkOut = addDays(checkIn, 1);
  else if (nights > MAX_NIGHTS) checkOut = addDays(checkIn, MAX_NIGHTS);
  return {
    checkIn,
    checkOut,
    adults: clampInt(input.adults ?? 2, 1, 30, 2),
    children: clampInt(input.children ?? 0, 0, 20, 0),
    rooms: clampInt(input.rooms ?? 1, 1, 10, 1),
    area: typeof input.area === 'string' && input.area ? input.area : 'all',
  };
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const dayOfWeek = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const shortLabel = (date: string) => `${WEEKDAY_SHORT[dayOfWeek(date)]} ${date.slice(8, 10)}/${date.slice(5, 7)}`;

/** Ba lựa chọn nhanh: ngày mai (1 đêm), cuối tuần tới (T6→CN), cuối tuần sau nữa. */
export function quickDatePresets(now: Date = new Date()): Array<{ label: string; inDate: string; outDate: string }> {
  const today = todayInVietnam(now);
  const tomorrow = addDays(today, 1);
  // Thứ Sáu gần nhất sau hôm nay (nếu hôm nay là thứ Sáu thì lấy tuần sau)
  const daysToFriday = ((5 - dayOfWeek(today) + 7) % 7) || 7;
  const fri1 = addDays(today, daysToFriday);
  const fri2 = addDays(fri1, 7);
  const make = (inDate: string, outDate: string) => ({ label: `${shortLabel(inDate)} → ${shortLabel(outDate)}`, inDate, outDate });
  return [make(tomorrow, addDays(tomorrow, 1)), make(fri1, addDays(fri1, 2)), make(fri2, addDays(fri2, 2))];
}
