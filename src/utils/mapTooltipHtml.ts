/**
 * HTML tooltip cho bản đồ Leaflet (bindTooltip nhận chuỗi như HTML).
 * Dữ liệu cơ sở/địa danh có thể do đối tác nhập nên phải escape trước khi chèn.
 */
import { formatVND } from './rules.ts';
import { escapeHtml } from './escapeHtml.ts';

export interface LandmarkTooltipInput {
  name: string;
  altitude: string | number;
  cloudProbability: number;
  bestTime: string;
}

export function buildLandmarkTooltipHtml(spot: LandmarkTooltipInput): string {
  return `<div style="font-family:sans-serif;padding:2px 4px;">
          <div style="font-weight:800;color:#073161;font-size:12px;">☁️ ${escapeHtml(spot.name)}</div>
          <div style="font-size:12px;color:#0d7a74;font-weight:700;">Độ cao ${escapeHtml(spot.altitude)} · Tỷ lệ săn mây ${escapeHtml(spot.cloudProbability)}%</div>
          <div style="font-size:12px;color:#475569;">Khung giờ vàng: ${escapeHtml(spot.bestTime)}</div>
        </div>`;
}

export interface ListingTooltipInput {
  title: string;
  area: string;
  rating: number;
  reviewCount: number;
  hasCloudView?: boolean;
  minPrice: number;
}

export function buildListingTooltipHtml(
  item: ListingTooltipInput,
  emoji: string,
  distance: { km: number; area: string } | null
): string {
  return `<div style="font-family:sans-serif;padding:2px 4px;min-width:170px;">
            <div style="font-weight:800;color:#073161;font-size:12px;">${escapeHtml(emoji)} ${escapeHtml(item.title)}</div>
            <div style="font-size:12px;color:#334155;margin-top:2px;">
              📍 ${escapeHtml(item.area)} · ⭐ ${escapeHtml(item.rating)} (${escapeHtml(item.reviewCount)})
              ${item.hasCloudView ? ' · <span style="color:#0d7a74;font-weight:700;">☁️ View biển mây</span>' : ''}
            </div>
            <div style="font-size:12px;font-weight:800;color:#0d7a74;margin-top:2px;">
              Giá từ: ${item.minPrice > 0 ? formatVND(item.minPrice) : 'Hỗ trợ 24/7'}
              ${distance ? ` · Cách ${escapeHtml(distance.area)} ${escapeHtml(distance.km)}km` : ''}
            </div>
          </div>`;
}
