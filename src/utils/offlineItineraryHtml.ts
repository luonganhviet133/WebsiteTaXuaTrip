/**
 * Phần HTML có chèn dữ liệu trong file lịch trình offline (.html) người dùng tải về.
 * Tên cơ sở, ghi chú, số điện thoại... phải escape để file tải về không chạy script lạ.
 */
import { formatVND } from './rules.ts';
import { escapeHtml } from './escapeHtml.ts';

export interface OfflineStepInput {
  time: string;
  title: string;
  location: string;
  activity: string;
  tip: string;
}

export interface OfflineListingInput {
  title: string;
  area: string;
  phone: string;
}

export function buildOfflineStepHtml(
  step: OfflineStepInput,
  listing: OfflineListingInput | null | undefined,
  costPerPerson: number
): string {
  return `<div style="border:1px solid #cbd5e1;border-radius:12px;padding:12px;margin-bottom:10px;background:#fff;">
              <div style="font-weight:800;color:#073161;font-size:14px;">🕒 ${escapeHtml(step.time)} — ${escapeHtml(step.title)}</div>
              <div style="font-size:12px;color:#475569;margin:4px 0;">📍 ${escapeHtml(step.location)} · Dự toán: <strong>${formatVND(costPerPerson)}/người</strong></div>
              <div style="font-size:13px;color:#1e293b;margin:4px 0;">${escapeHtml(step.activity)}</div>
              <div style="font-size:12px;color:#0f766e;background:#f0fdfa;padding:6px 10px;border-radius:8px;">💡 Lưu ý: ${escapeHtml(step.tip)}</div>
              ${
                listing
                  ? `<div style="margin-top:6px;font-size:12px;color:#073161;">🏡 Cơ sở đã chọn: <strong>${escapeHtml(listing.title)}</strong> (${escapeHtml(listing.area)}) — 📞 SĐT/Zalo: <strong>${escapeHtml(listing.phone)}</strong></div>`
                  : ''
              }
            </div>`;
}

export function buildOfflineDayHtml(dayTitle: string, stepsHtml: string): string {
  return `<h2 style="color:#073161;font-size:17px;margin-top:20px;border-bottom:2px solid #073161;padding-bottom:6px;">${escapeHtml(dayTitle)}</h2>${stepsHtml}`;
}
