/**
 * N06.2 — Điểm Mây = điểm ĐÓNG GÓP cho cộng đồng Tà Xùa (chủ dự án chốt 13/11/2026), không tính theo tiền chi tiêu.
 *  - Mỗi việc chỉ tính một lần, chỉ khi có thật (đơn hoàn tất do cơ sở xác nhận, đánh giá gắn đơn đã hoàn tất…).
 *  - Danh hiệu và số dư tính theo điểm 12 tháng gần nhất (D05: hết hạn sau 12 tháng).
 *  - Bảng xếp hạng hiện tên rút gọn; top 3 mỗi tháng do admin chốt và ghi quà.
 *  - Đổi điểm lấy quà: cơ chế có sẵn nhưng KHÓA tới khi chốt giá trị điểm và ai chịu phần giảm.
 * Phí nền tảng: mỗi cơ sở một mức do admin cài (cố định mỗi đơn hoặc % tổng đơn), ghi khi đơn hoàn tất; hóa đơn cuối tháng ở N06.3.
 */
export const POINT_RULES = {
  stay_completed: 20,
  review: 30, // N06.3
  review_photo: 20, // N06.3
  admin_award_max: 500,
} as const;

export const POINTS_WINDOW_DAYS = 365;
export const REDEMPTION_ENABLED = false;

export const TITLES = [
  { min: 0, name: 'Lữ khách mới' },
  { min: 100, name: 'Người săn mây' },
  { min: 300, name: 'Thổ địa Tà Xùa' },
  { min: 800, name: 'Đại sứ Tà Xùa' },
] as const;

export function titleFor(points: number): { name: string; next: { name: string; min: number } | null } {
  let i = 0;
  for (let k = 0; k < TITLES.length; k++) if (points >= TITLES[k].min) i = k;
  const next = TITLES[i + 1];
  return { name: TITLES[i].name, next: next ? { name: next.name, min: next.min } : null };
}

const cap = (w: string) => w.charAt(0).toLocaleUpperCase('vi-VN') + w.slice(1).toLocaleLowerCase('vi-VN');

/** "Nguyễn Văn Khách" → "Nguyễn V. K.". Tên trông như số điện thoại/email thì ẩn hẳn. */
export function shortName(fullName: string): string {
  const name = (fullName || '').trim();
  if (!name || /\d{4,}|@/.test(name)) return 'Thành viên';
  const words = name.split(/\s+/);
  if (words.length === 1) return cap(words[0]);
  return [cap(words[0]), ...words.slice(1).map((w) => `${w.charAt(0).toLocaleUpperCase('vi-VN')}.`)].join(' ');
}

export type FeeRate = { mode: 'fixed' | 'percent_bp'; value: number } | null;

/** Phí của một đơn: cố định (đồng) hoặc % tổng đơn tính bằng điểm cơ bản (500 = 5%), làm tròn thông thường tới đồng. */
export function feeFor(rate: FeeRate, totalAmount: number): number {
  if (!rate) return 0;
  if (rate.mode === 'fixed') return rate.value;
  return Math.floor((totalAmount * rate.value + 5000) / 10000);
}

/** Tháng (YYYY-MM) theo giờ Việt Nam. */
export function vnMonth(d: Date): string {
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 7);
}

export function previousVnMonth(d: Date): string {
  const [y, m] = vnMonth(d).split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
