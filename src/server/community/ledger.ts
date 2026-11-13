/**
 * N06.2 — Ghi sổ khi đơn HOÀN TẤT (chạy trong cùng batch với việc đổi trạng thái, sau kiểm changes() = 1):
 *  - +Điểm Mây "hoàn tất chuyến ở" cho khách (mỗi đơn một lần: UNIQUE(user_id, source_type, source_id)).
 *  - Một dòng phí nền tảng theo mức của cơ sở lúc đó (mỗi đơn một lần: chỉ mục duy nhất theo booking_id).
 * Cơ sở chưa cài mức phí (hoặc mức 0) thì không ghi phí.
 */
import { POINT_RULES, vnMonth } from '../../config/community.ts';

type D1Like = { prepare(sql: string): { bind(...v: unknown[]): any } };
const rid = (p: string) => `${p}_${Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, '0')).join('')}`;

export function completionLedgerStmts(d1: D1Like, bookingId: string, now: Date) {
  const nowIso = now.toISOString();
  return [
    d1
      .prepare(
        `INSERT OR IGNORE INTO points_ledger (id, user_id, source_type, source_id, points, reason, created_by, effective_at, created_at)
         SELECT ?, b.user_id, 'stay_completed', b.id, ?, 'Hoàn tất chuyến ở', NULL, ?, ? FROM bookings b WHERE b.id = ?`
      )
      .bind(rid('pl'), POINT_RULES.stay_completed, nowIso, nowIso, bookingId),
    d1
      .prepare(
        `INSERT OR IGNORE INTO fee_ledger (id, listing_id, booking_id, kind, amount, basis_amount, rate_mode, rate_value, period, reason, created_by, created_at)
         SELECT ?, b.listing_id, b.id, 'platform_fee',
                CASE r.mode WHEN 'fixed' THEN r.value ELSE (b.total_amount * r.value + 5000) / 10000 END,
                b.total_amount, r.mode, r.value, ?, NULL, NULL, ?
         FROM bookings b JOIN listing_fee_rates r ON r.listing_id = b.listing_id
         WHERE b.id = ? AND r.value > 0`
      )
      .bind(rid('fe'), vnMonth(now), nowIso, bookingId),
  ];
}
