/**
 * R3 — Header bảo mật cho mọi phản hồi.
 * - Tệp tĩnh do Cloudflare phục vụ thẳng: public/_headers (test giữ hai nơi khớp nhau).
 * - Phản hồi do Worker tạo (API, trang SPA dự phòng): withSecurityHeaders().
 * CSP chạy hai tầng: phần chắc chắn không làm hỏng trang thì BẮT BUỘC (cấm nhúng trang vào web khác,
 * cấm plugin, khóa <base>); chính sách đầy đủ chạy CHẾ ĐỘ BÁO CÁO (Report-Only) để xem trình duyệt
 * báo vi phạm gì trước khi bật bắt buộc.
 */

export const CSP_ENFORCED = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'";

export const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com https://www.google.com https://www.youtube.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Bản đồ và nút SOS dùng vị trí; không dùng camera/micro/thanh toán trình duyệt.
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  'Content-Security-Policy': CSP_ENFORCED,
  'Content-Security-Policy-Report-Only': CSP_REPORT_ONLY,
};

/** Thêm header bảo mật; header phản hồi đã tự đặt (ví dụ CSP riêng) thì giữ nguyên. */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  // Phản hồi chuyển hướng/101 không đổi được thân; Response mới giữ nguyên thân và trạng thái.
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Nội dung public/_headers sinh từ cùng hằng số (test so khớp với tệp thật). */
export function headersFileContent(): string {
  const lines = ['# Sinh từ src/server/security/headers.ts (R3). Sửa ở đó rồi chạy `npm run gen:headers`.', '/*'];
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) lines.push(`  ${k}: ${v}`);
  return lines.join('\n') + '\n';
}
