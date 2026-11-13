/**
 * N05.3 — Gọi API vòng đời đơn. Trình duyệt không tự đổi trạng thái; mọi thao tác qua server.
 * Các hàm thuần (nút được hiện, nhãn) phản chiếu bảng trong src/server/bookings/lifecycle.ts,
 * server vẫn là nơi quyết định cuối.
 */
import { todayInVietnam } from '../search/searchIntent.ts';
import { displayBookingStatus } from './holdsApi.ts';
import { balanceDueAt } from '../config/payment.ts';

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
  balanceConfirmedAt?: string | null;
  createdAt: string;
  /** Chỉ có trong danh sách của chủ cơ sở (N06.1) */
  depositReceipts?: number;
  balanceReceipts?: number;
  needsReconciliation?: boolean;
}

export interface BookingDetail extends ServerBooking {
  events: BookingEventView[];
  checkinToken: string | null;
}

export interface PayoutAccount {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentSnapshot {
  bookingId: string;
  bookingCode: string;
  payeeBankBin: string;
  payeeBankName: string;
  payeeAccountNumber: string;
  payeeAccountName: string;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  depositMemo: string;
  balanceMemo: string;
  balanceDueAt: string;
  termsVersion: string;
  vietQrDeposit: string;
  vietQrBalance: string;
}

export interface PaymentView {
  bookingId: string;
  status: string;
  termsVersion: string;
  termsPoints: string[];
  termsAccepted: boolean;
  payoutReady: boolean;
  snapshot: PaymentSnapshot | null;
  receipts: { id: string; kind: 'deposit' | 'balance'; contentType: string; createdAt: string }[];
  depositConfirmedAt: string | null;
  balanceConfirmedAt: string | null;
  balanceDueAt: string;
  balanceOverdue: boolean;
}

export type OwnerAction = 'confirm' | 'reject' | 'complete' | 'confirm_balance' | 'release';
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

export function ownerActions(
  b: { status: string; holdExpiresAt: string | null; balanceConfirmedAt?: string | null; checkInDate: string },
  now: number = Date.now()
): OwnerAction[] {
  if (b.status === 'pending_deposit') return holdLive(b.holdExpiresAt, now) ? ['confirm', 'reject'] : [];
  const balancePaid = !!b.balanceConfirmedAt;
  if (b.status === 'confirmed') {
    if (balancePaid) return [];
    return now >= balanceDueAt(b.checkInDate).getTime() ? ['confirm_balance', 'release'] : ['confirm_balance'];
  }
  if (b.status === 'checked_in') return balancePaid ? ['complete'] : ['confirm_balance', 'complete'];
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
  act: (id: string, action: Exclude<OwnerAction, 'confirm_balance'> | 'cancel', reason?: string) =>
    call<ServerBooking>('POST', `/api/bookings/${encodeURIComponent(id)}/${action}`, reason ? { reason } : {}),
  // N06.1 — thanh toán (D03)
  payment: (id: string) => call<PaymentView>('GET', `/api/bookings/${encodeURIComponent(id)}/payment`),
  acceptTerms: (id: string, termsVersion: string) =>
    call<PaymentView>('POST', `/api/bookings/${encodeURIComponent(id)}/payment/accept-terms`, { termsVersion }),
  confirmBalance: (id: string) => call<null>('POST', `/api/bookings/${encodeURIComponent(id)}/payment/confirm-balance`, {}),
  uploadReceipt: async (id: string, kind: 'deposit' | 'balance', file: Blob): Promise<ApiOutcome<{ id: string }>> => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/payment/receipts?kind=${kind}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      const data: any = await res.json().catch(() => null);
      if (res.ok && data?.success) return { ok: true, data: data.data };
      return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không gửi được ảnh.' };
    } catch {
      return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
    }
  },
  /** Ảnh biên lai cần đăng nhập nên tải bằng fetch rồi tạo URL tạm trong trình duyệt. */
  receiptObjectUrl: async (id: string, receiptId: string): Promise<string | null> => {
    const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/payment/receipts/${encodeURIComponent(receiptId)}`, {
      headers: { Authorization: `Bearer ${token()}` },
    }).catch(() => null);
    if (!res || !res.ok) return null;
    return URL.createObjectURL(await res.blob());
  },
  getPayout: (listingId: string) => call<PayoutAccount | null>('GET', `/api/partner/listings/${encodeURIComponent(listingId)}/payout-account`),
  setPayout: (listingId: string, body: { bankBin: string; accountNumber: string; accountName: string }) =>
    call<PayoutAccount>('PUT', `/api/partner/listings/${encodeURIComponent(listingId)}/payout-account`, body),
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
