// Thanh toán trực tuyến (mã VietQR đặt cọc, nộp biên lai, "xác nhận đã chuyển khoản") đang tắt.
// Chưa chốt tỷ lệ cọc và người nhận tiền (quyết định D03), và số tài khoản trong
// buildVietQrPaymentPayload (src/utils/rules.ts) là tài khoản mẫu gõ cứng: bật lên sẽ hiện
// mã QR chuyển tiền thật tới tài khoản đó. Chỉ bật ở N06 khi đã có tài khoản nhận và quy trình đối soát.
export const ONLINE_PAYMENT_ENABLED = false;
