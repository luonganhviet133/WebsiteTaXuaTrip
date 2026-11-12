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
