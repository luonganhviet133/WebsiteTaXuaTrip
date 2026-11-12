import type { Listing, MappableListing } from '../types/index.ts';

/** Chỉ giữ cơ sở có tọa độ thật để đặt ghim bản đồ (N03: không suy tọa độ từ khu vực). */
export function onlyMappable(listings: Listing[]): MappableListing[] {
  return listings.filter((l): l is MappableListing => Boolean(l.coordinates));
}

/** Giá hiển thị: 0 nghĩa là nguồn chưa có giá, không phải miễn phí. */
export function formatMinPrice(minPrice: number, format: (n: number) => string): string {
  return minPrice > 0 ? format(minPrice) : 'Liên hệ';
}

/** Nhãn xác minh kèm nguồn, theo D06. */
export function verificationLabel(l: Pick<Listing, 'verificationTier' | 'verification' | 'dataOrigin' | 'collectedAt'>): { title: string; detail: string } {
  const v = l.verification;
  if (l.verificationTier >= 2 && v?.verifiedAt) {
    const date = v.verifiedAt.slice(0, 10).split('-').reverse().join('/');
    return {
      title: l.verificationTier === 3 ? 'Đã thẩm định thực địa' : 'Đã xác minh giấy tờ',
      detail: `${v.source || 'Tà Xùa Trip'} · ${date}`,
    };
  }
  if (v?.expired) return { title: 'Xác minh đã hết hạn', detail: 'Thông tin cần kiểm tra lại' };
  if (l.dataOrigin === 'scraped') {
    const date = l.collectedAt ? ` ngày ${l.collectedAt.split('-').reverse().join('/')}` : '';
    return { title: 'Chưa xác minh', detail: `Thu thập từ nguồn công khai${date}` };
  }
  return { title: 'Chưa xác minh', detail: 'Thông tin do cơ sở tự khai' };
}

/**
 * N05.1: ghi phòng trống từ server (theo đúng ngày khách đang chọn) vào từng hạng phòng,
 * để bộ lọc, thẻ, trang chi tiết đọc cùng một nguồn tồn. Cơ sở không có trong bảng tồn giữ nguyên.
 */
export function applyAvailability(listings: Listing[], map: Record<string, Record<string, number>> | null): Listing[] {
  if (!map) return listings;
  return listings.map((l) => {
    const rooms = map[l.id];
    if (!rooms || !l.roomTypes || l.roomTypes.length === 0) return l;
    return { ...l, roomTypes: l.roomTypes.map((r) => ({ ...r, availableRooms: rooms[r.id] ?? 0 })) };
  });
}
