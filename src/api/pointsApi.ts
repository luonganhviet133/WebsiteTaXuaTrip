/** N06.2 — Điểm Mây (đóng góp), bảng xếp hạng, top 3, phí nền tảng: gọi server. Trình duyệt không tự cộng/trừ điểm. */
const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

export type Outcome<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };

async function call<T>(method: string, path: string, body?: unknown, auth = true): Promise<Outcome<T>> {
  try {
    const headers: Record<string, string> = {};
    if (auth && token()) headers.Authorization = `Bearer ${token()}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, data: data.data as T };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không thực hiện được.' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export interface MyPoints {
  points12m: number;
  balance: number;
  lifetime: number;
  monthPoints: number;
  title: string;
  next: { name: string; min: number } | null;
  redemptionEnabled: boolean;
  history: { id: string; sourceType: string; points: number; reason: string | null; effectiveAt: string; createdAt: string; expired: boolean }[];
}
export interface LeaderRow {
  rank: number;
  name: string;
  points: number;
  title: string;
}
export interface FeeEntry {
  id: string;
  listingId: string;
  listingTitle: string | null;
  bookingId: string | null;
  bookingCode: string | null;
  kind: 'platform_fee' | 'reversal';
  amount: number;
  basisAmount: number | null;
  rateMode: 'fixed' | 'percent_bp' | null;
  rateValue: number | null;
  period: string;
  reason: string | null;
  reversed: boolean;
  createdAt: string;
}

export const SOURCE_LABEL: Record<string, string> = {
  stay_completed: 'Hoàn tất chuyến ở',
  review: 'Đánh giá xác thực',
  review_photo: 'Ảnh thật trong đánh giá',
  admin_award: 'Đóng góp được duyệt',
  admin_revoke: 'Thu hồi',
  redemption: 'Đổi quà',
};

export const pointsApi = {
  me: () => call<MyPoints>('GET', '/api/me/points'),
  leaderboard: (scope: 'month' | 'quarter' | 'year' | '12m', month?: string) =>
    call<{ items: LeaderRow[]; month: string | null }>('GET', `/api/community/leaderboard?scope=${scope}${month ? `&month=${month}` : ''}`, undefined, false),
  winners: (month: string) => call<{ month: string; winners: { rank: number; name: string; points: number }[] }>('GET', `/api/community/monthly-winners?month=${month}`, undefined, false),
  partnerFees: (month: string) => call<{ month: string; entries: FeeEntry[]; total: number }>('GET', `/api/partner/fees?month=${month}`),
  // admin
  adminRates: () => call<{ listingId: string; title: string; mode: 'fixed' | 'percent_bp'; value: number; note: string | null; updatedAt: string }[]>('GET', '/api/admin/fees/rates'),
  setRate: (listingId: string, body: { mode: string; value: number; note?: string }) => call<unknown>('PUT', `/api/admin/fees/rates/${encodeURIComponent(listingId)}`, body),
  adminFees: (month: string) => call<{ month: string; entries: FeeEntry[]; total: number }>('GET', `/api/admin/fees/ledger?month=${month}`),
  reverseFee: (id: string, reason: string) => call<unknown>('POST', `/api/admin/fees/ledger/${encodeURIComponent(id)}/reverse`, { reason }),
  award: (body: { userEmail: string; points: number; reason: string; idempotencyKey: string }) => call<unknown>('POST', '/api/admin/points/award', body),
  revoke: (id: string, reason: string) => call<unknown>('POST', `/api/admin/points/${encodeURIComponent(id)}/revoke`, { reason }),
  adminUserPoints: (email: string) => call<MyPoints & { userId: string; fullName: string; email: string }>('GET', `/api/admin/points?email=${encodeURIComponent(email)}`),
  adminMonthly: (month: string) =>
    call<{
      month: string;
      finished: boolean;
      ranking: { rank: number; userId: string; fullName: string; points: number; title: string }[];
      awards: { rank: number; userId: string; fullName: string; points: number; giftNote: string; awardedAt: string }[];
    }>('GET', `/api/admin/community/monthly?month=${month}`),
  awardMonthly: (month: string, body: { rank: number; userId: string; giftNote: string }) => call<unknown>('POST', `/api/admin/community/monthly/${month}/award`, body),
};

/** Hiển thị mức phí: "50.000 đ/đơn" hoặc "5%" (điểm cơ bản → %). */
export function rateLabel(mode: string | null, value: number | null): string {
  if (!mode || value === null) return '—';
  if (mode === 'fixed') return `${value.toLocaleString('vi-VN')} đ/đơn`;
  return `${(value / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
}

export const newKey = () => 'k_' + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
