/**
 * R1 — Luật tài khoản (chủ dự án chốt 13/11/2026): mật khẩu tối thiểu 8 ký tự, khóa tạm khi sai nhiều lần,
 * mã 6 số qua email cho xác minh email và đặt lại mật khẩu (chưa dùng SMS).
 */
export const PASSWORD_MIN = 8;
export const LOCKOUT = { maxFailures: 5, minutes: 15 };
export const CODE_POLICY = { digits: 6, ttlMinutes: 15, maxAttempts: 5, resendSeconds: 60, maxPerHour: 5 };
/** Phiên bản Điều khoản & Chính sách dữ liệu đang hiện; đổi nội dung thì đổi ngày này. */
export const TERMS_VERSION = '2026-11-13';

const COMMON = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '88888888', '66666666',
  'password', 'password1', 'matkhau', 'matkhau1', 'matkhau123', 'qwertyui', 'qwerty123', 'abc12345',
  'iloveyou', 'taxuatrip', 'taxua123', 'admin123', 'abcd1234', '1q2w3e4r',
]);

export function checkPassword(pw: string, email: string): string | null {
  if (typeof pw !== 'string' || pw.length < PASSWORD_MIN) return `Mật khẩu cần tối thiểu ${PASSWORD_MIN} ký tự.`;
  if (pw.length > 128) return 'Mật khẩu tối đa 128 ký tự.';
  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(pw)) return 'Mật khẩu quá dễ đoán, vui lòng chọn mật khẩu khác.';
  const local = (email || '').split('@')[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) return 'Mật khẩu không được chứa phần tên trong email.';
  return null;
}

export function normalizeEmail(raw: unknown): string | null {
  const e = String(raw ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) && e.length <= 254 ? e : null;
}

/** Số di động/cố định VN về dạng 0xxxxxxxxx (10 số, đầu 02–09). */
export function normalizeVnPhone(raw: unknown): string | null {
  let p = String(raw ?? '').replace(/[\s.\-()]/g, '');
  if (p.startsWith('+84')) p = '0' + p.slice(3);
  else if (/^84\d{9}$/.test(p)) p = '0' + p.slice(2);
  return /^0[2-9]\d{8}$/.test(p) ? p : null;
}

export function lockoutAfterFailure(s: { failures: number; lockedUntil: string | null }, now: number) {
  const failures = s.failures + 1;
  if (failures >= LOCKOUT.maxFailures) return { failures: 0, lockedUntil: new Date(now + LOCKOUT.minutes * 60_000).toISOString() };
  return { failures, lockedUntil: null };
}

export function isLockedOut(lockedUntil: string | null | undefined, now: number): boolean {
  return !!lockedUntil && Date.parse(lockedUntil) > now;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const keep = local.length > 2 ? 2 : 1;
  return `${local.slice(0, keep)}${'•'.repeat(Math.max(1, local.length - keep))}@${domain}`;
}

export function deviceLabel(ua: string | null | undefined): string {
  const s = ua || '';
  if (!s) return 'Thiết bị không rõ';
  const os = /iPhone/.test(s) ? 'iPhone' : /iPad/.test(s) ? 'iPad' : /Android/.test(s) ? 'Android' : /Windows/.test(s) ? 'Windows' : /Mac OS X|Macintosh/.test(s) ? 'Mac' : /Linux/.test(s) ? 'Linux' : 'Khác';
  const br = /Edg\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera' : /Zalo/i.test(s) ? 'Zalo' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari/.test(s) ? 'Safari' : 'Trình duyệt khác';
  return `${os} · ${br}`;
}
