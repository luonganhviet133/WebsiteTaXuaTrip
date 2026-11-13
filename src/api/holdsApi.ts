/**
 * N05.2 — Giữ chỗ homestay trên máy chủ. Tổng tiền và cọc do server tính từ báo giá đã lưu.
 * Mỗi lần bấm "Đặt" dùng một khóa idempotency; bấm lại sau lỗi mạng dùng lại đúng khóa đó
 * để server không tạo đơn thứ hai.
 */
import type { Attribution } from '../search/attribution.ts';

export interface HoldBooking {
  id: string;
  bookingCode: string;
  listingId: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  roomTypeId: string | null;
  roomName: string | null;
  rooms: number | null;
  adults: number | null;
  children: number | null;
  subtotal: number | null;
  discount: number | null;
  voucherCode: string | null;
  totalAmount: number;
  depositAmount: number;
  status: string;
  holdExpiresAt: string | null;
  quoteId: string | null;
  createdAt: string;
}

export interface HoldRequestBody {
  quoteId: string;
  idempotencyKey: string;
  guestName: string;
  guestPhone: string;
  guestNote?: string;
  attribution?: Attribution | null;
}

export type HoldOutcome =
  | { ok: true; booking: HoldBooking; replay: boolean }
  | { ok: false; status: number; code: string; message: string };

export function newIdempotencyKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return 'hk_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createHold(body: HoldRequestBody, token: string): Promise<HoldOutcome> {
  try {
    const res = await fetch('/api/bookings/holds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, booking: data.data as HoldBooking, replay: !!data.replay };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không giữ được phòng.' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối khi giữ phòng. Bấm đặt lại — hệ thống sẽ không tạo đơn trùng.' };
  }
}

/** Việc giao diện cần làm sau một lỗi giữ chỗ. */
export type HoldErrorAction = 'login' | 'refresh_quote' | 'retry_same_key' | 'show';

export function holdErrorAction(status: number, code: string): HoldErrorAction {
  if (status === 401) return 'login';
  if (code === 'NETWORK' || status >= 500) return 'retry_same_key';
  if (['QUOTE_EXPIRED', 'QUOTE_NOT_FOUND', 'LISTING_CHANGED', 'SOLD_OUT', 'VOUCHER_USED_UP'].includes(code)) return 'refresh_quote';
  return 'show';
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Giờ hết hạn giữ chỗ theo giờ Việt Nam (UTC+7), dạng "14:35 ngày 13/11". */
export function holdExpiryLabel(iso: string): string {
  const d = new Date(Date.parse(iso) + 7 * 3600_000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ngày ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}
