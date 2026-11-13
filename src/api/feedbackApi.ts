/**
 * N06.3 — Đánh giá xác thực và khiếu nại: gọi server. Trình duyệt không tự cộng điểm, không tự đổi điểm sao,
 * không tự đóng khiếu nại. complaintButtons phản chiếu bảng luật ở src/server/feedback/rules.ts.
 */
const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

export type Outcome<T> = { ok: true; data: T; already?: boolean } | { ok: false; status: number; code: string; message: string };

async function call<T>(method: string, path: string, body?: unknown): Promise<Outcome<T>> {
  try {
    const headers: Record<string, string> = {};
    if (token()) headers.Authorization = `Bearer ${token()}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, data: data.data as T, already: data.already };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không thực hiện được.' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
  }
}

async function sendImage<T>(path: string, file: Blob): Promise<Outcome<T>> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token()}`, 'Content-Type': file.type || 'application/octet-stream' }, body: file });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, data: data.data };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không gửi được ảnh.' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
  }
}

/** Ảnh cần đăng nhập: tải bằng fetch rồi tạo URL tạm trong trình duyệt. */
async function objectUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token()}` } });
    return res.ok ? URL.createObjectURL(await res.blob()) : null;
  } catch {
    return null;
  }
}

export interface ReviewItem {
  id: string;
  bookingId?: string;
  listingId: string;
  authorName: string;
  rating: number;
  comment: string;
  photoIds: string[];
  ownerReply: string | null;
  ownerReplyAt: string | null;
  status: 'published' | 'hidden';
  hiddenReason?: string | null;
  createdAt: string;
  verifiedStay: true;
}
export interface ReviewState {
  canWrite: boolean;
  reason: string | null;
  windowEndsAt: string | null;
  canAddPhotos: boolean;
  review: ReviewItem | null;
  points: { review: number; photo: number };
}
export type ComplaintStatus = 'open' | 'in_review' | 'refund_pending' | 'refund_reported' | 'refund_disputed' | 'closed';
export type ComplaintActionName =
  | 'assign'
  | 'respond'
  | 'withdraw'
  | 'conclude'
  | 'report_refund'
  | 'confirm_refund'
  | 'refund_not_received'
  | 'admin_confirm_refund'
  | 'require_refund';
export type ComplaintMode = 'guest' | 'owner' | 'admin';
export interface ComplaintInfo {
  id: string;
  status: ComplaintStatus;
  outcome: 'withdrawn' | 'rejected' | 'upheld' | 'refunded' | null;
  category: string;
  categoryLabel: string;
  description: string;
  ownerResponse: string | null;
  assignedAt: string | null;
  conclusion: 'upheld' | 'rejected' | null;
  conclusionNote: string | null;
  concludedAt: string | null;
  refundAmount: number | null;
  refundDueAt: string | null;
  refundReportedAmount: number | null;
  closedAt: string | null;
  createdAt: string;
}
export interface ComplaintView {
  bookingId: string;
  bookingCode: string;
  totalAmount: number;
  complaint: ComplaintInfo | null;
  canOpen: boolean;
  openBlockedReason: string | null;
  openDeadline: string;
  refundOverdue: boolean;
  categories: Record<string, string>;
  files: { id: string; role: 'guest' | 'owner' | 'admin'; createdAt: string }[];
  events: { action: string; fromStatus: string | null; toStatus: string; actorRole: string; note: string | null; createdAt: string }[];
}

const BUTTONS: Record<ComplaintMode, Partial<Record<ComplaintStatus, ComplaintActionName[]>>> = {
  guest: { open: ['withdraw'], in_review: ['withdraw'], refund_reported: ['confirm_refund', 'refund_not_received'] },
  owner: { open: ['respond'], in_review: ['respond'], refund_pending: ['report_refund'] },
  admin: { open: ['assign'], in_review: ['conclude'], refund_disputed: ['admin_confirm_refund', 'require_refund'] },
};
export function complaintButtons(mode: ComplaintMode, status: ComplaintStatus, refundOverdue: boolean): ComplaintActionName[] {
  if (mode === 'guest' && status === 'refund_pending') return refundOverdue ? ['refund_not_received'] : [];
  return BUTTONS[mode][status] || [];
}

const b = (id: string) => `/api/bookings/${encodeURIComponent(id)}`;
export const feedbackApi = {
  reviewState: (bookingId: string) => call<ReviewState>('GET', `${b(bookingId)}/review`),
  createReview: (bookingId: string, rating: number, comment: string) => call<ReviewState>('POST', `${b(bookingId)}/review`, { rating, comment }),
  addPhoto: (bookingId: string, file: Blob) => sendImage<{ id: string }>(`${b(bookingId)}/review/photos`, file),
  photoUrl: (photoId: string) => `/api/reviews/photos/${encodeURIComponent(photoId)}`,
  listingReviews: (listingId: string) =>
    call<{ listingId: string; count: number; average: number; items: ReviewItem[] }>('GET', `/api/listings/${encodeURIComponent(listingId)}/reviews`),
  reply: (reviewId: string, reply: string) => call<{ ownerReply: string }>('POST', `/api/reviews/${encodeURIComponent(reviewId)}/reply`, { reply }),
  adminReviews: () => call<(ReviewItem & { bookingCode: string; listingTitle: string; authorFullName: string })[]>('GET', '/api/admin/reviews'),
  hide: (reviewId: string, reason: string) => call<{ id: string }>('POST', `/api/admin/reviews/${encodeURIComponent(reviewId)}/hide`, { reason }),

  complaint: (bookingId: string) => call<ComplaintView>('GET', `${b(bookingId)}/complaint`),
  openComplaint: (bookingId: string, category: string, description: string) => call<ComplaintView>('POST', `${b(bookingId)}/complaint`, { category, description }),
  complaintUpload: (bookingId: string, file: Blob) => sendImage<{ id: string }>(`${b(bookingId)}/complaint/files`, file),
  complaintFileUrl: (bookingId: string, fileId: string) => objectUrl(`${b(bookingId)}/complaint/files/${encodeURIComponent(fileId)}`),
  complaintAct: (bookingId: string, action: ComplaintActionName, body: Record<string, unknown> = {}) =>
    call<ComplaintView>('POST', `${b(bookingId)}/complaint/${action}`, body),
  adminComplaints: () =>
    call<(ComplaintInfo & { bookingId: string; bookingCode: string; listingTitle: string; guestName: string; guestPhone: string; totalAmount: number })[]>(
      'GET',
      '/api/admin/complaints'
    ),
};
