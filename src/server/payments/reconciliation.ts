/**
 * Đối soát cọc (chủ dự án chốt 13/11/2026): khách đã chuyển cọc khi giữ chỗ còn hạn nhưng đơn hết hạn
 * (hoặc bị cơ sở từ chối) trước khi cơ sở xác nhận.
 *  - Cơ sở HOÀN đủ trong 3 ngày (kèm ảnh chứng từ hoàn), hoặc ĐỀ NGHỊ GIỮ tiền (vd chuyển ngày/phòng khác)
 *    — chỉ được giữ khi KHÁCH bấm đồng ý.
 *  - Khách xác nhận đã nhận lại tiền → đóng. Chưa nhận / quá hạn chưa hoàn → khách báo admin.
 *  - Admin xem bằng chứng hai bên và ghi kết luận. Hệ thống KHÔNG chuyển tiền.
 * Khách tự hủy và nhả phòng quá hạn 70% theo D03 (không hoàn) không mở đối soát.
 *
 *   open ──refund (chủ, có chứng từ)──▶ refund_reported ──confirm_received (khách)──▶ closed(refunded)
 *     │                                      └──dispute (khách)──▶ disputed
 *     ├─propose_hold (chủ)──▶ hold_proposed ──accept_hold (khách)──▶ closed(held)
 *     │                            └──reject_hold (khách)──▶ open
 *     └─dispute (khách, quá hạn 3 ngày)──▶ disputed ──resolve_refunded | resolve_held (admin)──▶ closed
 *                                                  └──resolve_refund_required (admin)──▶ open (hạn mới 3 ngày)
 */
export const RECON_DUE_MS = 3 * 24 * 3600_000;

export type ReconStatus = 'open' | 'refund_reported' | 'hold_proposed' | 'disputed' | 'closed';
export type ReconOutcome = 'refunded' | 'held';
export type ReconAction =
  | 'refund'
  | 'propose_hold'
  | 'accept_hold'
  | 'reject_hold'
  | 'confirm_received'
  | 'dispute'
  | 'resolve_refunded'
  | 'resolve_held'
  | 'resolve_refund_required';
export type ReconParty = 'guest' | 'owner' | 'admin';

interface Rule {
  from: ReconStatus[];
  to: ReconStatus;
  who: ReconParty[];
  outcome?: ReconOutcome;
}

export const RECON_RULES: Record<ReconAction, Rule> = {
  refund: { from: ['open'], to: 'refund_reported', who: ['owner', 'admin'] },
  propose_hold: { from: ['open'], to: 'hold_proposed', who: ['owner'] },
  accept_hold: { from: ['hold_proposed'], to: 'closed', who: ['guest'], outcome: 'held' },
  reject_hold: { from: ['hold_proposed'], to: 'open', who: ['guest'] },
  confirm_received: { from: ['refund_reported'], to: 'closed', who: ['guest'], outcome: 'refunded' },
  dispute: { from: ['open', 'refund_reported'], to: 'disputed', who: ['guest'] },
  resolve_refunded: { from: ['disputed'], to: 'closed', who: ['admin'], outcome: 'refunded' },
  resolve_held: { from: ['disputed'], to: 'closed', who: ['admin'], outcome: 'held' },
  resolve_refund_required: { from: ['disputed'], to: 'open', who: ['admin'] },
};

export function shouldOpenReconciliation(e: { action: string; depositReceipts: number; confirmedAt: string | null }): boolean {
  return (e.action === 'expire' || e.action === 'reject') && e.depositReceipts > 0 && !e.confirmedAt;
}

export type ReconDecision =
  | { kind: 'apply'; from: ReconStatus; to: ReconStatus; outcome?: ReconOutcome; newDueAt?: string }
  | { kind: 'already' }
  | { kind: 'deny'; status: number; code: string; message: string };

const deny = (status: number, code: string, message: string): ReconDecision => ({ kind: 'deny', status, code, message });

export function reconDecide(
  action: ReconAction,
  current: { status: ReconStatus; dueAt: string; outcome?: ReconOutcome | null },
  parties: ReconParty[],
  ctx: { now: number; refundProofs?: number }
): ReconDecision {
  const rule = RECON_RULES[action];
  if (!parties.some((p) => rule.who.includes(p))) return deny(403, 'FORBIDDEN', 'Bạn không có quyền với bước đối soát này.');
  // Làm lại đúng bước vừa làm (bấm lặp) → không ghi thêm
  if (current.status === rule.to && rule.to !== 'open' && (!rule.outcome || rule.outcome === current.outcome)) return { kind: 'already' };
  if (current.status === 'closed') return deny(409, 'CLOSED', 'Đối soát đã kết thúc.');
  if (!rule.from.includes(current.status)) return deny(409, 'INVALID_STATE', 'Bước này không áp dụng ở trạng thái đối soát hiện tại.');
  if (action === 'refund' && !(ctx.refundProofs && ctx.refundProofs > 0)) {
    return deny(409, 'PROOF_REQUIRED', 'Vui lòng tải ảnh chứng từ đã chuyển hoàn trước khi báo đã hoàn.');
  }
  if (action === 'dispute' && current.status === 'open' && ctx.now < Date.parse(current.dueAt)) {
    return deny(409, 'NOT_OVERDUE', 'Cơ sở còn trong hạn 3 ngày để hoàn. Bạn báo được khi quá hạn hoặc khi cơ sở báo đã hoàn mà bạn chưa nhận.');
  }
  const d: ReconDecision = { kind: 'apply', from: current.status, to: rule.to };
  if (rule.outcome) d.outcome = rule.outcome;
  if (action === 'resolve_refund_required') d.newDueAt = new Date(ctx.now + RECON_DUE_MS).toISOString();
  return d;
}

/**
 * Các câu lệnh MỞ đối soát (dùng trong cùng batch với việc hết hạn/từ chối, đặt TRƯỚC câu đổi trạng thái đơn):
 * dòng đối soát + lịch sử + thông báo cho chủ cơ sở và khách. `where` chọn đơn trong bảng bookings (bí danh b),
 * luôn kèm điều kiện chưa xác nhận cọc và đã có biên lai cọc.
 */
export function openReconciliationStmts(
  d1: { prepare(sql: string): { bind(...v: unknown[]): any } },
  o: { where: string; params: unknown[]; nowIso: string; reason: string }
) {
  const due = new Date(Date.parse(o.nowIso) + RECON_DUE_MS).toISOString();
  const cond = `${o.where} AND b.confirmed_at IS NULL AND EXISTS (SELECT 1 FROM payment_receipts r WHERE r.booking_id = b.id AND r.kind = 'deposit')
    AND NOT EXISTS (SELECT 1 FROM payment_reconciliations x WHERE x.booking_id = b.id)`;
  const dueVn = `strftime('%H:%M %d/%m', '${due}', '+7 hours')`;
  return [
    // Thông báo + lịch sử trước (điều kiện NOT EXISTS còn đúng), rồi mới chèn dòng đối soát.
    d1
      .prepare(
        `INSERT OR IGNORE INTO notifications (id, user_id, kind, booking_id, title, body, created_at, read_at, dedupe_key)
         SELECT 'nt_' || lower(hex(randomblob(10))), p.user_id, 'recon.opened', b.id, 'Đơn ' || b.booking_code || ' cần đối soát cọc',
                'Khách đã gửi biên lai cọc nhưng ' || ? || '. Hoàn đủ trước ' || ${dueVn} || ' (kèm ảnh chứng từ) hoặc đề nghị giữ tiền — chỉ giữ được khi khách đồng ý.',
                ?, NULL, 'recon_open:' || b.id || ':' || p.user_id
         FROM bookings b JOIN provider_listings pl ON pl.listing_id = b.listing_id JOIN providers p ON p.id = pl.provider_id
         WHERE ${cond}`
      )
      .bind(o.reason, o.nowIso, ...o.params),
    d1
      .prepare(
        `INSERT OR IGNORE INTO notifications (id, user_id, kind, booking_id, title, body, created_at, read_at, dedupe_key)
         SELECT 'nt_' || lower(hex(randomblob(10))), b.user_id, 'recon.opened', b.id, 'Đơn ' || b.booking_code || ': đối soát tiền cọc',
                'Bạn đã gửi biên lai cọc nhưng ' || ? || '. Cơ sở phải hoàn trước ' || ${dueVn} || ' hoặc đề nghị giữ tiền để bạn đồng ý. Quá hạn bạn báo được Tà Xùa Trip.',
                ?, NULL, 'recon_open:' || b.id || ':' || b.user_id
         FROM bookings b WHERE ${cond}`
      )
      .bind(o.reason, o.nowIso, ...o.params),
    d1
      .prepare(
        `INSERT INTO booking_events (id, booking_id, action, from_status, to_status, actor_id, actor_role, reason, created_at)
         SELECT 'ev_' || lower(hex(randomblob(10))), b.id, 'recon_open', NULL, 'open', NULL, 'system', ?, ? FROM bookings b WHERE ${cond}`
      )
      .bind(o.reason, o.nowIso, ...o.params),
    d1
      .prepare(
        `INSERT OR IGNORE INTO payment_reconciliations (booking_id, status, outcome, reason, opened_at, due_at, updated_at)
         SELECT b.id, 'open', NULL, ?, ?, ?, ? FROM bookings b WHERE ${cond}`
      )
      .bind(o.reason, o.nowIso, due, o.nowIso, ...o.params),
  ];
}
