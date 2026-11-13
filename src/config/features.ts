/**
 * R4 — Cờ tính năng: một nơi duy nhất quyết định tính năng nào đã mở cho người dùng thật.
 * Dùng chung cho giao diện (hiện khối "Sắp ra mắt") và server (API trả 503 FEATURE_LOCKED),
 * để không ai gọi được tính năng chưa xong bằng cách gọi thẳng API.
 * Mở một tính năng: đổi `open` thành true trong cùng commit có test của tính năng đó.
 */
// Luồng thanh toán MẪU cũ (biên lai ảnh mẫu, "đã chuyển khoản" một chạm) của xe khách/dịch vụ lưu trong trình duyệt: đang tắt.
// Homestay đặt qua server dùng luồng thật theo D03 từ N06.1 (điều khoản → tài khoản cơ sở + VietQR → biên lai R2 →
// cơ sở xác nhận), không phụ thuộc cờ này. Chỉ bật lại khi xe/dịch vụ chuyển lên server (N09).
export const ONLINE_PAYMENT_ENABLED = false;

export interface FeatureInfo {
  open: boolean;
  /** Tên hiển thị trong khối "Sắp ra mắt". */
  title: string;
  /** Một câu nói tình trạng thật và việc người dùng làm được ngay. */
  note: string;
}

export const FEATURES = {
  aiAdvisor: {
    open: false,
    title: 'Tư vấn AI',
    note: 'Trợ lý AI sẽ gợi ý dựa trên phòng còn trống và giá thật. Hiện bạn có thể lọc cơ sở ở mục Lưu trú và xem đường đi trên Bản đồ.',
  },
  itineraryPlanner: {
    open: false,
    title: 'Lên kế hoạch chuyến đi',
    note: 'Lịch trình 2N1Đ, 3N2Đ, 4N3Đ gắn với phòng, xe và quán có thật đang được hoàn thiện. Hiện bạn có thể xem điểm săn mây trên Bản đồ và đặt phòng ở mục Lưu trú.',
  },
  cloudForecast: {
    open: false,
    title: 'Dự báo săn mây',
    note: 'Dự báo theo ngày cần nguồn thời tiết thật nên chưa mở. Kinh nghiệm chung: biển mây thường đẹp nhất từ tháng 10 đến tháng 4, khoảng 5:30–8:30 sáng.',
  },
  communityChat: {
    open: false,
    title: 'Chat cộng đồng',
    note: 'Phòng chat cho khách và người địa phương đang được hoàn thiện. Bảng xếp hạng Điểm Mây đã hoạt động.',
  },
  busBooking: {
    open: false,
    title: 'Đặt vé xe khách',
    note: 'Đặt vé trực tuyến chưa mở vì lịch chạy chưa được nhà xe xác nhận. Bạn có thể xem cơ sở vận chuyển ở mục Di chuyển và gọi trực tiếp.',
  },
  adminAssistant: {
    open: false,
    title: 'Trợ lý quản trị J.A.R.V.I.S.',
    note: 'Bản thử nghiệm, chưa nối dữ liệu thật đầy đủ nên tạm ẩn.',
  },
  aiGateway: {
    open: false,
    title: 'Cổng AI (RevidAPI) và AI Studio',
    note: 'Bản thử nghiệm của giai đoạn AI Studio, chưa dùng cho người dùng thật nên tạm ẩn.',
  },
  hostingExport: {
    open: false,
    title: 'Đóng gói website',
    note: 'Website chạy trên Cloudflare; tính năng tải gói mã cũ đã gỡ.',
  },
} as const satisfies Record<string, FeatureInfo>;

export type FeatureKey = keyof typeof FEATURES;

export function isOpen(key: FeatureKey): boolean {
  return FEATURES[key].open;
}

/** API thuộc tính năng nào (để server chặn khi tính năng đang khóa). */
export function featureForApi(method: string, pathname: string): FeatureKey | null {
  if (method === 'POST' && (pathname === '/api/ai/consult' || pathname === '/api/ai/quick-quote')) return 'aiAdvisor';
  if (pathname.startsWith('/api/revid/')) return 'aiGateway';
  return null;
}
