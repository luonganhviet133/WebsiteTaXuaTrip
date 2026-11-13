/**
 * N05.3 — Bảng chuyển trạng thái đơn. Chỉ server đổi trạng thái, và chỉ theo bảng này.
 *
 *   pending_deposit ──confirm (chủ/admin, còn hạn)──▶ confirmed ──check_in (chủ/admin, QR, đúng ngày)──▶ checked_in ──complete (chủ/admin)──▶ completed
 *        │  └─reject (chủ/admin, còn hạn)──▶ cancelled                │
 *        └─cancel (khách/admin, còn hạn)──▶ cancelled  ◀──cancel (khách trước ngày nhận phòng; admin)──┘
 *   pending_deposit ──(cron/hết giờ)──▶ expired
 *
 * Làm lại thao tác đã xong → "already" (không ghi gì thêm). Chủ cơ sở chưa tự hủy đơn đã xác nhận
 * (chờ quy tắc quá hạn 70% ở N06.1). Hoàn tất chưa có tác động tiền/điểm (N06).
 */
export type BookingStatus =
  | 'draft' | 'pending' | 'pending_deposit' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'expired';
export type BookingAction = 'confirm' | 'reject' | 'check_in' | 'complete' | 'cancel';
/** Quan hệ của người thao tác với đơn: khách đặt, chủ cơ sở của đơn, admin. */
export type Party = 'guest' | 'owner' | 'admin';

export interface Transition {
  from: BookingStatus[];
  to: BookingStatus;
  who: Party[];
}

export const TRANSITIONS: Record<BookingAction, Transition> = {
  confirm: { from: ['pending_deposit'], to: 'confirmed', who: ['owner', 'admin'] },
  reject: { from: ['pending_deposit'], to: 'cancelled', who: ['owner', 'admin'] },
  check_in: { from: ['confirmed'], to: 'checked_in', who: ['owner', 'admin'] },
  complete: { from: ['checked_in'], to: 'completed', who: ['owner', 'admin'] },
  cancel: { from: ['pending_deposit', 'confirmed'], to: 'cancelled', who: ['guest', 'admin'] },
};

export const ACTION_LABEL: Record<BookingAction, string> = {
  confirm: 'xác nhận đã nhận cọc',
  reject: 'từ chối đơn',
  check_in: 'nhận phòng',
  complete: 'hoàn tất',
  cancel: 'hủy đơn',
};

export interface DecideContext {
  /** Ngày hôm nay theo giờ Việt Nam (YYYY-MM-DD) */
  today: string;
  checkIn: string;
  checkOut: string;
  /** Đơn pending_deposit đã quá hold_expires_at */
  holdExpired: boolean;
}

export type Decision =
  | { kind: 'apply'; from: BookingStatus; to: BookingStatus }
  | { kind: 'already'; to: BookingStatus }
  | { kind: 'deny'; status: number; code: string; message: string };

const deny = (status: number, code: string, message: string): Decision => ({ kind: 'deny', status, code, message });

export function decide(action: BookingAction, current: BookingStatus, parties: Party[], c: DecideContext): Decision {
  const t = TRANSITIONS[action];
  if (!parties.some((p) => t.who.includes(p))) {
    return deny(403, 'FORBIDDEN', `Bạn không có quyền ${ACTION_LABEL[action]} cho đơn này.`);
  }
  if (current === t.to) return { kind: 'already', to: t.to };
  if (current === 'expired' || (current === 'pending_deposit' && c.holdExpired)) {
    return deny(409, 'HOLD_EXPIRED', 'Giữ chỗ đã hết hạn, phòng đã được trả lại.');
  }
  if (!t.from.includes(current)) {
    return deny(409, 'INVALID_STATE', `Đơn đang ở trạng thái "${current}", không ${ACTION_LABEL[action]} được.`);
  }
  if (action === 'check_in') {
    if (c.today < c.checkIn) return deny(409, 'TOO_EARLY', 'Chưa tới ngày nhận phòng của đơn này.');
    if (c.today >= c.checkOut) return deny(410, 'QR_EXPIRED', 'Mã nhận phòng đã hết hạn (đã qua ngày trả phòng).');
  }
  if (action === 'cancel' && current === 'confirmed' && !parties.includes('admin')) {
    if (c.today >= c.checkIn) return deny(409, 'TOO_LATE_TO_CANCEL', 'Đã tới ngày nhận phòng, không tự hủy được. Vui lòng liên hệ cơ sở hoặc Tà Xùa Trip.');
  }
  return { kind: 'apply', from: current, to: t.to };
}
