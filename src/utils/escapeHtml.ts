/**
 * Escape chuỗi trước khi chèn vào HTML dựng bằng template string
 * (tooltip/marker Leaflet nhận HTML, file lịch trình .html tải về).
 * Dùng cho cả nội dung thẻ lẫn giá trị thuộc tính trong ngoặc kép.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
