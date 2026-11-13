/**
 * N05.3 — Gọi API vòng đời đơn. Trình duyệt không tự đổi trạng thái; mọi thao tác qua server.
 * Các hàm thuần (nút được hiện, nhãn) phản chiếu bảng trong src/server/bookings/lifecycle.ts,
 * server vẫn là nơi quyết định cuối.
 */
import { todayInVietnam } from '../search/searchIntent.ts';
import { displayBookingStatus } from './holdsApi.ts';

export interface BookingEventView {
  action: string;
  fromStatus: string | null;
  toStatus: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
}

export interface ServerBooking {
  id: string;
  bookingCode: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  roomName: string | null;
  rooms: number | null;
  adults: number | null;
  children: number | null;
  totalAmount: number;
  depositAmount: number;
  discount: number | null;
  voucherCode: string | null;
  status: string;
  holdExpiresAt: string | null;
  guestNote: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface BookingDetail extends ServerBooking {
  events: BookingEventView[];
  checkinToken: string | null;
}

export type OwnerAction = 'confirm' | 'reject' | 'complete';
export type ApiOutcome<T> = { ok: true; data: T; already?: boolean } | { ok: false; status: number; code: string; message: string };

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function checkinUrl(origin: string, token: string): string {
  return `${origin}/doi-tac/nhan-phong?ma=${token}`;
}

/** Nhận đường dẫn QR (quét/dán) hoặc mã trần; trả mã nếu đúng dạng. */
export function parseCheckinInput(text: string): string | null {
  const t = text.trim();
  if (TOKEN_RE.test(t)) return t;
  try {
    const m = new URL(t).searchParams.get('ma') || '';
    return TOKEN_RE.test(m) ? m : null;
  } catch {
    return null;
  }
}

const holdLive = (holdExpiresAt: string | null, now: number) => !!holdExpiresAt && Date.parse(holdExpiresAt) > now;

export function ownerActions(status: string, holdExpiresAt: string | null, now: number = Date.now()): OwnerAction[] {
  if (status === 'pending_deposit') return holdLive(holdExpiresAt, now) ? ['confirm', 'reject'] : [];
  if (status === 'checked_in') return ['complete'];
  return [];
}

export function guestCanCancel(b: { status: string; holdExpiresAt: string | null; checkInDate: string }, now: number = Date.now()): boolean {
  if (b.status === 'pending_deposit') return holdLive(b.holdExpiresAt, now);
  if (b.status === 'confirmed') return todayInVietnam(new Date(now)) < b.checkInDate;
  return false;
}

const LABEL: Record<string, string> = {
  pending: 'Giữ chỗ · Chờ cọc',
  expired: 'Hết hạn giữ chỗ',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã nhận phòng',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export function statusLabel(status: string, holdExpiresAt: string | null, now: number = Date.now()): string {
  const s = displayBookingStatus(status, holdExpiresAt, now);
  return LABEL[s] || s;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Thời điểm đặt: ISO của server → "HH:mm dd/mm/yyyy" giờ VN; chuỗi cũ (đơn lưu trình duyệt) giữ nguyên. */
export function formatCreatedAt(value: string): string {
  if (!/T\d{2}:\d{2}/.test(value)) return value;
  const d = new Date(Date.parse(value) + 7 * 3600_000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

export function guestCountOf(b: { guestsCount?: number | null; adults?: number | null; children?: number | null }): number {
  if (typeof b.guestsCount === 'number') return b.guestsCount;
  return (b.adults ?? 0) + (b.children ?? 0);
}

const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

async function call<T>(method: string, path: string, body?: unknown): Promise<ApiOutcome<T>> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token()}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, data: data.data as T, already: data.already };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không thực hiện được.' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export const bookingsApi = {
  detail: (id: string) => call<BookingDetail>('GET', `/api/bookings/${encodeURIComponent(id)}`),
  act: (id: string, action: OwnerAction | 'cancel', reason?: string) =>
    call<ServerBooking>('POST', `/api/bookings/${encodeURIComponent(id)}/${action}`, reason ? { reason } : {}),
  partnerList: (listingId?: string) =>
    call<ServerBooking[]>('GET', `/api/partner/bookings${listingId ? `?listingId=${encodeURIComponent(listingId)}` : ''}`),
  checkinPreview: (t: string) => call<ServerBooking>('GET', `/api/partner/checkin?token=${encodeURIComponent(t)}`),
  checkin: (t: string) => call<ServerBooking>('POST', '/api/partner/checkin', { token: t }),
  notifications: () =>
    call<{ unread: number; items: { id: string; kind: string; bookingId: string | null; title: string; body: string; createdAt: string; read: boolean }[] }>(
      'GET',
      '/api/notifications'
    ),
  markAllRead: () => call<null>('POST', '/api/notifications/read', { all: true }),
};
