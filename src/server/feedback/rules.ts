/**
 * N06.3 — Luật đánh giá xác thực và khiếu nại (chủ dự án chốt 13/11/2026).
 *
 * Đánh giá: khách của đơn đã hoàn tất, mỗi đơn một lần, trong 30 ngày kể từ lúc cơ sở bấm hoàn tất.
 *
 * Khiếu nại: khách mở từ khi cơ sở đã xác nhận cọc đến 7 ngày sau giờ trả phòng (12:00 giờ VN).
 * Kết luận và hoàn tiền là hai việc riêng; website không giữ tiền (D03) nên cơ sở hoàn, khách xác nhận.
 *
 *   open ──assign (admin)──▶ in_review ──conclude (admin, không hoàn)──▶ closed(rejected | upheld)
 *     │  (cơ sở respond: ghi trả lời,        └──conclude (admin, có số tiền hoàn)──▶ refund_pending (hạn 3 ngày)
 *     │   không đổi trạng thái)                   refund_pending ──report_refund (cơ sở, có chứng từ)──▶ refund_reported
 *     └──withdraw (khách, trước kết luận)──▶ closed(withdrawn)
 *   refund_reported ──confirm_refund (khách)──▶ closed(refunded)
 *   refund_reported | refund_pending quá hạn ──refund_not_received (khách)──▶ refund_disputed
 *   refund_disputed ──admin_confirm_refund──▶ closed(refunded)  |  ──require_refund──▶ refund_pending (hạn mới)
 */
export const REVIEW_WINDOW_DAYS = 30;
export const COMPLAINT_WINDOW_DAYS = 7;
/** Hạn cơ sở hoàn theo kết luận khiếu nại — dùng cùng hạn 3 ngày của đối soát cọc (D-N06-02). */
export const REFUND_DUE_MS = 3 * 24 * 3600_000;
const CHECKOUT_HOUR_VN = 12;

type Party = 'guest' | 'owner' | 'admin';
type Check = { ok: true } | { ok: false; status: number; code: string; message: string };
const no = (status: number, code: string, message: string): Check => ({ ok: false, status, code, message });

export function reviewDecide(b: { status: string; completedAt: string | null }, parties: Party[], now: number): Check {
  if (!parties.includes('guest')) return no(403, 'FORBIDDEN', 'Chỉ khách đặt đơn được viết đánh giá.');
  if (b.status !== 'completed' || !b.completedAt) return no(409, 'NOT_COMPLETED', 'Đánh giá được viết sau khi cơ sở xác nhận chuyến ở đã hoàn tất.');
  if (now > Date.parse(b.completedAt) + REVIEW_WINDOW_DAYS * 86400_000) {
    return no(409, 'REVIEW_WINDOW_CLOSED', `Đã quá ${REVIEW_WINDOW_DAYS} ngày kể từ khi chuyến ở hoàn tất.`);
  }
  return { ok: true };
}

/** Hạn mở khiếu nại: 12:00 giờ VN, 7 ngày sau ngày trả phòng. */
export function complaintDeadline(checkOutDate: string): Date {
  const [y, m, d] = checkOutDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + COMPLAINT_WINDOW_DAYS, CHECKOUT_HOUR_VN - 7));
}

export function canOpenComplaint(b: { status: string; confirmedAt: string | null; checkOutDate: string }, parties: Party[], now: number): Check {
  if (!parties.includes('guest')) return no(403, 'FORBIDDEN', 'Chỉ khách đặt đơn được mở khiếu nại.');
  if (!b.confirmedAt || !['confirmed', 'checked_in', 'completed', 'cancelled'].includes(b.status)) {
    return no(409, 'NOT_CONFIRMED', 'Khiếu nại mở được sau khi cơ sở đã xác nhận nhận cọc. Cọc chưa được xác nhận thì dùng phần đối soát cọc.');
  }
  if (now >= complaintDeadline(b.checkOutDate).getTime()) {
    return no(409, 'COMPLAINT_WINDOW_CLOSED', `Đã quá ${COMPLAINT_WINDOW_DAYS} ngày sau ngày trả phòng.`);
  }
  return { ok: true };
}

export type ComplaintStatus = 'open' | 'in_review' | 'refund_pending' | 'refund_reported' | 'refund_disputed' | 'closed';
export type ComplaintOutcome = 'withdrawn' | 'rejected' | 'upheld' | 'refunded';
export type Conclusion = 'upheld' | 'rejected';
export type ComplaintAction =
  | 'assign'
  | 'respond'
  | 'withdraw'
  | 'conclude'
  | 'report_refund'
  | 'confirm_refund'
  | 'refund_not_received'
  | 'admin_confirm_refund'
  | 'require_refund';

interface Rule {
  from: ComplaintStatus[];
  to: ComplaintStatus | 'same';
  who: Party[];
  outcome?: ComplaintOutcome;
}

export const COMPLAINT_RULES: Record<ComplaintAction, Rule> = {
  assign: { from: ['open'], to: 'in_review', who: ['admin'] },
  respond: { from: ['open', 'in_review'], to: 'same', who: ['owner'] },
  withdraw: { from: ['open', 'in_review'], to: 'closed', who: ['guest'], outcome: 'withdrawn' },
  conclude: { from: ['in_review'], to: 'closed', who: ['admin'] },
  report_refund: { from: ['refund_pending'], to: 'refund_reported', who: ['owner'] },
  confirm_refund: { from: ['refund_reported'], to: 'closed', who: ['guest'], outcome: 'refunded' },
  refund_not_received: { from: ['refund_reported', 'refund_pending'], to: 'refund_disputed', who: ['guest'] },
  admin_confirm_refund: { from: ['refund_disputed'], to: 'closed', who: ['admin'], outcome: 'refunded' },
  require_refund: { from: ['refund_disputed'], to: 'refund_pending', who: ['admin'] },
};

export type ComplaintDecision =
  | { kind: 'apply'; from: ComplaintStatus; to: ComplaintStatus; outcome?: ComplaintOutcome; newRefundDueAt?: string }
  | { kind: 'already' }
  | { kind: 'deny'; status: number; code: string; message: string };

const deny = (status: number, code: string, message: string): ComplaintDecision => ({ kind: 'deny', status, code, message });

export function complaintDecide(
  action: ComplaintAction,
  current: { status: ComplaintStatus; refundDueAt: string | null; outcome?: ComplaintOutcome | null },
  parties: Party[],
  ctx: { now: number; refundProofs?: number; conclusion?: Conclusion; refundAmount?: number }
): ComplaintDecision {
  const rule = COMPLAINT_RULES[action];
  if (!parties.some((p) => rule.who.includes(p))) return deny(403, 'FORBIDDEN', 'Bạn không có quyền với bước này của khiếu nại.');
  // Bấm lặp đúng bước vừa làm → không ghi thêm
  const repeated =
    rule.to !== 'same' && rule.to !== 'refund_pending' && current.status === rule.to && action !== 'conclude' && (!rule.outcome || rule.outcome === current.outcome);
  if (repeated) return { kind: 'already' };
  if (current.status === 'closed') return deny(409, 'CLOSED', 'Khiếu nại đã đóng.');
  if (!rule.from.includes(current.status)) return deny(409, 'INVALID_STATE', 'Bước này không áp dụng ở trạng thái khiếu nại hiện tại.');

  const to: ComplaintStatus = rule.to === 'same' ? current.status : rule.to;
  if (action === 'conclude') {
    const amount = ctx.refundAmount ?? 0;
    if (ctx.conclusion !== 'upheld' && ctx.conclusion !== 'rejected') return deny(400, 'INVALID_CONCLUSION', 'Chọn kết luận: khách đúng hoặc không chấp nhận khiếu nại.');
    if (!Number.isInteger(amount) || amount < 0) return deny(400, 'INVALID_REFUND', 'Số tiền hoàn là số nguyên không âm.');
    if (ctx.conclusion === 'rejected' && amount > 0) return deny(400, 'INVALID_REFUND', 'Không chấp nhận khiếu nại thì không đề nghị hoàn tiền.');
    if (amount > 0) return { kind: 'apply', from: current.status, to: 'refund_pending', newRefundDueAt: new Date(ctx.now + REFUND_DUE_MS).toISOString() };
    return { kind: 'apply', from: current.status, to: 'closed', outcome: ctx.conclusion };
  }
  if (action === 'report_refund' && !(ctx.refundProofs && ctx.refundProofs > 0)) {
    return deny(409, 'PROOF_REQUIRED', 'Vui lòng tải ảnh chứng từ đã chuyển hoàn trước khi báo đã hoàn.');
  }
  if (action === 'refund_not_received' && current.status === 'refund_pending' && (!current.refundDueAt || ctx.now < Date.parse(current.refundDueAt))) {
    return deny(409, 'NOT_OVERDUE', 'Cơ sở còn trong hạn 3 ngày để hoàn. Bạn báo được khi quá hạn hoặc khi cơ sở báo đã hoàn mà bạn chưa nhận.');
  }
  if (action === 'require_refund') {
    return { kind: 'apply', from: current.status, to, newRefundDueAt: new Date(ctx.now + REFUND_DUE_MS).toISOString() };
  }
  return rule.outcome ? { kind: 'apply', from: current.status, to, outcome: rule.outcome } : { kind: 'apply', from: current.status, to };
}
