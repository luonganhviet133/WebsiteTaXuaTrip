// Luồng thanh toán MẪU cũ (biên lai ảnh mẫu, "đã chuyển khoản" một chạm) của xe khách/dịch vụ lưu trong trình duyệt: đang tắt.
// Homestay đặt qua server dùng luồng thật theo D03 từ N06.1 (điều khoản → tài khoản cơ sở + VietQR → biên lai R2 →
// cơ sở xác nhận), không phụ thuộc cờ này. Chỉ bật lại khi xe/dịch vụ chuyển lên server (N09).
export const ONLINE_PAYMENT_ENABLED = false;
