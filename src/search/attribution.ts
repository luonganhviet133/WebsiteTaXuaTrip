/**
 * N04.1 — Ghi nguồn khách (UTM) ngay khi trang mở, trước khi router viết lại URL.
 * Ghi lần chạm đầu (first-touch) và không ghi đè. Gắn vào đơn đặt để biết khách đến từ kênh nào.
 */
export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ref?: string;
  referrer?: string;
  landingPath?: string;
  landedAt: string;
}

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const ATTRIBUTION_KEY = 'taxua_attribution_v1';
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'] as const;

export function readAttribution(storage: KeyValueStore): Attribution | null {
  try {
    const raw = storage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

export function captureAttribution(
  search: string,
  referrer: string,
  storage: KeyValueStore,
  now: Date = new Date(),
  landingPath?: string
): Attribution | null {
  const existing = readAttribution(storage);
  if (existing) return existing;
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const found: Partial<Attribution> = {};
  for (const k of KEYS) {
    const v = sp.get(k);
    if (v) found[k] = v.slice(0, 200);
  }
  if (Object.keys(found).length === 0) return null;
  const attribution: Attribution = { ...found, landedAt: now.toISOString() };
  if (referrer) attribution.referrer = referrer.slice(0, 500);
  if (landingPath) attribution.landingPath = landingPath.slice(0, 300);
  try {
    storage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    /* trình duyệt chặn lưu trữ: bỏ qua */
  }
  return attribution;
}
