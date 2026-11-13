/**
 * N06.1 — Chính sách cọc DUY NHẤT cho server, VietQR và mọi màn (D03, chủ dự án đã chốt).
 *  - Cọc 30% chuyển thẳng tài khoản cơ sở, làm tròn LÊN tới đồng; 70% còn lại trả trước giờ nhận phòng 24 giờ.
 *  - Website không giữ tiền; cơ sở bấm xác nhận đã nhận (xác nhận thủ công, có log).
 *  - Hủy không hoàn tiền; khách tick đồng ý điều khoản trước khi thấy thông tin chuyển cọc.
 * Giờ nhận phòng 14:00 lấy theo giao diện hiện có (giả định chờ chủ dự án xác nhận, xem D-N06-01).
 */
export const DEPOSIT_PERCENT = 30;
export const CHECKIN_HOUR_VN = 14;
export const BALANCE_DUE_HOURS_BEFORE = 24;
export const BALANCE_REMINDER_HOURS = [48, 30] as const;

export const TERMS_VERSION = 'D03-2026-11-13';
export const TERMS_POINTS = [
  'Cọc 30% chuyển thẳng vào tài khoản của cơ sở. Tà Xùa Trip không giữ tiền.',
  'Phần 70% còn lại trả cho cơ sở trước giờ nhận phòng 24 giờ. Quá hạn chưa trả đủ, cơ sở được nhả phòng và cọc không hoàn.',
  'Hủy đơn không hoàn tiền cọc.',
  'Đổi ngày do thời tiết: khách tự thỏa thuận với cơ sở.',
] as const;

/** Cọc làm tròn LÊN tới đồng để cơ sở không nhận thiếu. */
export function depositFor(total: number, percent: number = DEPOSIT_PERCENT): number {
  return Math.ceil((total * percent) / 100);
}

export function balanceFor(total: number, percent: number = DEPOSIT_PERCENT): number {
  return total - depositFor(total, percent);
}

const VN_OFFSET_MS = 7 * 3600_000;

/** Thời điểm nhận phòng: 14:00 giờ VN ngày nhận phòng. */
export function checkInAt(checkInDate: string): Date {
  return new Date(Date.parse(`${checkInDate}T00:00:00Z`) + CHECKIN_HOUR_VN * 3600_000 - VN_OFFSET_MS);
}

export function balanceDueAt(checkInDate: string): Date {
  return new Date(checkInAt(checkInDate).getTime() - BALANCE_DUE_HOURS_BEFORE * 3600_000);
}

export function reminderTimes(checkInDate: string): { hours: number; at: Date }[] {
  const t = checkInAt(checkInDate).getTime();
  return BALANCE_REMINDER_HOURS.map((hours) => ({ hours, at: new Date(t - hours * 3600_000) }));
}

export function transferMemo(bookingCode: string, kind: 'deposit' | 'balance'): string {
  return `${bookingCode} ${kind === 'deposit' ? 'COC' : 'CON LAI'}`;
}

/** Bỏ dấu tiếng Việt, đổi đ→d, in hoa, gộp khoảng trắng (tên chủ tài khoản, nội dung chuyển khoản). */
export function toAsciiUpper(s: string): string {
  return stripVietnamese(s).toUpperCase().replace(/\s+/g, ' ').trim();
}

export function stripVietnamese(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export const normalizeAccountName = toAsciiUpper;
