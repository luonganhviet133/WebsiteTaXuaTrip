/**
 * N06.3 — Đánh giá xác thực và khiếu nại (luật ở ./rules.ts).
 * Đánh giá: +30 Điểm Mây cùng batch với lúc ghi, ảnh thật đầu tiên +20; admin ẩn thì thu hồi bằng dòng bù.
 * Khiếu nại: mỗi bước là UPDATE có điều kiện trạng thái + kiểm changes() = 1, kèm lịch sử và thông báo.
 */
import type { D1Database } from '../d1.ts';
import { POINT_RULES, shortName } from '../../config/community.ts';
import { BookingLifecycle, type LifecycleActor } from '../bookings/store.ts';
import { HoldStore, notifyOwnersStmt, notifyUserStmt } from '../bookings/holds.ts';
import { MAX_RECEIPT_BYTES, detectImageType } from '../payments/store.ts';
import type { PrivateStorage } from '../payments/storage.ts';
import {
  REFUND_DUE_MS, REVIEW_WINDOW_DAYS, canOpenComplaint, complaintDeadline, complaintDecide, reviewDecide,
  type ComplaintAction, type ComplaintStatus, type ComplaintOutcome, type Conclusion,
} from './rules.ts';

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });
const rid = (p: string) => `${p}_${Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, '0')).join('')}`;
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const MAX_REVIEW_PHOTOS = 3;
export const MAX_COMPLAINT_FILES_PER_SIDE = 5;
export const COMPLAINT_CATEGORIES: Record<string, string> = {
  room: 'Phòng/cơ sở không đúng mô tả',
  service: 'Thái độ, dịch vụ',
  safety: 'An toàn, vệ sinh',
  price: 'Thu thêm tiền, sai giá',
  other: 'Khác',
};
type Party = 'guest' | 'owner' | 'admin';

/** Thông báo cho mọi admin (khiếu nại mới, khách báo chưa nhận tiền hoàn). */
function notifyAdminsStmt(d1: D1Database, n: { kind: string; bookingId: string; title: string; body: string; now: string }) {
  return d1
    .prepare(
      `INSERT INTO notifications (id, user_id, kind, booking_id, title, body, created_at, read_at)
       SELECT 'nt_' || lower(hex(randomblob(10))), id, ?, ?, ?, ?, ?, NULL FROM profiles WHERE role = 'admin'`
    )
    .bind(n.kind, n.bookingId, n.title.slice(0, 120), n.body.slice(0, 300), n.now);
}

export class FeedbackStore {
  private lifecycle: BookingLifecycle;
  private holds: HoldStore;
  constructor(private d1: D1Database, private storage?: PrivateStorage) {
    this.lifecycle = new BookingLifecycle(d1);
    this.holds = new HoldStore(d1);
  }

  private booking(id: string) {
    return this.d1
      .prepare('SELECT id, booking_code, user_id, listing_id, listing_title, status, check_out_date, total_amount, confirmed_at, completed_at FROM bookings WHERE id = ?')
      .bind(id)
      .first<any>();
  }
  private async parties(b: any, actor: LifecycleActor): Promise<Party[]> {
    return (await this.lifecycle.partiesOf(b, actor)).filter((p): p is Party => p === 'guest' || p === 'owner' || p === 'admin');
  }
  private async savePhoto(prefix: string, bytes: Uint8Array): Promise<{ key: string; type: string; id: string } | Fail> {
    if (!this.storage) return fail(503, 'STORAGE_NOT_CONFIGURED', 'Chưa cấu hình kho lưu ảnh.');
    if (bytes.length > MAX_RECEIPT_BYTES) return fail(413, 'TOO_LARGE', 'Ảnh tối đa 5 MB.');
    const type = detectImageType(bytes);
    if (!type) return fail(415, 'NOT_AN_IMAGE', 'Chỉ nhận ảnh JPG, PNG hoặc WebP.');
    const id = rid(prefix === 'reviews' ? 'rp' : 'cf');
    const key = `${prefix}/${id}`;
    await this.storage.put(key, bytes, type);
    return { key, type, id };
  }

  // ================= Đánh giá =================

  private async photosOf(reviewIds: string[]) {
    if (reviewIds.length === 0) return new Map<string, string[]>();
    const r = await this.d1
      .prepare(`SELECT id, review_id FROM review_photos WHERE review_id IN (${reviewIds.map(() => '?').join(',')}) ORDER BY created_at, rowid`)
      .bind(...reviewIds)
      .all<any>();
    const m = new Map<string, string[]>();
    for (const p of r.results || []) m.set(p.review_id, [...(m.get(p.review_id) || []), p.id]);
    return m;
  }

  private toReview(r: any, photos: string[], full: boolean) {
    return {
      id: r.id,
      bookingId: full ? r.booking_id : undefined,
      listingId: r.listing_id,
      authorName: shortName(r.full_name || ''),
      rating: r.rating,
      comment: r.comment,
      photoIds: photos,
      ownerReply: r.owner_reply ?? null,
      ownerReplyAt: r.owner_reply_at ?? null,
      status: r.status,
      hiddenReason: full ? r.hidden_reason ?? null : undefined,
      createdAt: r.created_at,
      verifiedStay: true,
    };
  }

  /** Trạng thái đánh giá của một đơn (khách xem được viết hay chưa, hạn tới khi nào). */
  async reviewState(bookingId: string, actor: LifecycleActor, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    if (parties.length === 0) return fail(403, 'FORBIDDEN', 'Bạn không có quyền với đơn này.');
    const r = await this.d1.prepare('SELECT r.*, p.full_name FROM reviews r JOIN profiles p ON p.id = r.user_id WHERE r.booking_id = ?').bind(bookingId).first<any>();
    const check = reviewDecide({ status: b.status, completedAt: b.completed_at }, parties, now.getTime());
    const windowEndsAt = b.completed_at ? new Date(Date.parse(b.completed_at) + REVIEW_WINDOW_DAYS * 86400_000).toISOString() : null;
    return {
      ok: true as const,
      data: {
        canWrite: !r && check.ok,
        reason: r ? null : check.ok ? null : check.message,
        windowEndsAt,
        canAddPhotos: !!r && r.status === 'published' && check.ok && parties.includes('guest'),
        review: r ? this.toReview(r, (await this.photosOf([r.id])).get(r.id) || [], true) : null,
        points: { review: POINT_RULES.review, photo: POINT_RULES.review_photo },
      },
    };
  }

  async createReview(bookingId: string, actor: LifecycleActor, input: any, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    const check = reviewDecide({ status: b.status, completedAt: b.completed_at }, parties, now.getTime());
    if (!check.ok) return fail(check.status, check.code, check.message);
    const rating = Number(input?.rating);
    const comment = text(input?.comment, 2000);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(400, 'INVALID_RATING', 'Chọn từ 1 đến 5 sao.');
    if (comment.length < 20) return fail(400, 'COMMENT_TOO_SHORT', 'Viết ít nhất 20 ký tự về trải nghiệm thật của bạn.');
    const id = rid('rv');
    const nowIso = now.toISOString();
    try {
      await this.d1.batch([
        this.d1
          .prepare('INSERT INTO reviews (id, booking_id, listing_id, user_id, rating, comment, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, bookingId, b.listing_id, b.user_id, rating, comment, 'published', nowIso, nowIso),
        this.d1
          .prepare(
            `INSERT OR IGNORE INTO points_ledger (id, user_id, source_type, source_id, points, reason, created_by, effective_at, created_at)
             VALUES (?, ?, 'review', ?, ?, ?, NULL, ?, ?)`
          )
          .bind(rid('pl'), b.user_id, id, POINT_RULES.review, `Đánh giá xác thực ${b.listing_title}`, nowIso, nowIso),
        notifyOwnersStmt(this.d1, {
          listingId: b.listing_id, kind: 'review.new', bookingId,
          title: `Đơn ${b.booking_code}: khách để lại đánh giá ${rating} sao`,
          body: 'Bạn có thể trả lời công khai dưới đánh giá trong trang quản lý cơ sở.', now: nowIso,
        }),
      ]);
    } catch (err: any) {
      if (/UNIQUE constraint failed/i.test(String(err?.message))) return fail(409, 'ALREADY_REVIEWED', 'Đơn này đã có đánh giá.');
      throw err;
    }
    return this.reviewState(bookingId, actor, now);
  }

  async addReviewPhoto(bookingId: string, actor: LifecycleActor, bytes: Uint8Array, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    const check = reviewDecide({ status: b.status, completedAt: b.completed_at }, parties, now.getTime());
    if (!check.ok) return fail(check.status, check.code, check.message);
    const r = await this.d1.prepare('SELECT id, status FROM reviews WHERE booking_id = ?').bind(bookingId).first<any>();
    if (!r) return fail(409, 'NO_REVIEW', 'Viết đánh giá trước rồi thêm ảnh.');
    if (r.status !== 'published') return fail(409, 'REVIEW_HIDDEN', 'Đánh giá đã bị ẩn.');
    const saved = await this.savePhoto('reviews', bytes);
    if ('ok' in saved) return saved;
    const nowIso = now.toISOString();
    const [ins] = await this.d1.batch([
      this.d1
        .prepare(
          `INSERT INTO review_photos (id, review_id, object_key, content_type, size_bytes, created_at)
           SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM review_photos WHERE review_id = ?) < ?`
        )
        .bind(saved.id, r.id, saved.key, saved.type, bytes.length, nowIso, r.id, MAX_REVIEW_PHOTOS),
      // Ảnh thật đầu tiên: +20 một lần cho mỗi đánh giá (khóa duy nhất theo nguồn).
      this.d1
        .prepare(
          `INSERT OR IGNORE INTO points_ledger (id, user_id, source_type, source_id, points, reason, created_by, effective_at, created_at)
           SELECT ?, ?, 'review_photo', ?, ?, 'Ảnh thật trong đánh giá', NULL, ?, ? WHERE EXISTS (SELECT 1 FROM review_photos WHERE review_id = ?)`
        )
        .bind(rid('pl'), b.user_id, r.id, POINT_RULES.review_photo, nowIso, nowIso, r.id),
    ]);
    if (!Number(ins?.meta?.changes ?? 0)) {
      await this.storage!.delete(saved.key);
      return fail(409, 'TOO_MANY_PHOTOS', `Mỗi đánh giá tối đa ${MAX_REVIEW_PHOTOS} ảnh.`);
    }
    return { ok: true as const, data: { id: saved.id } };
  }

  /** Ảnh đánh giá: công khai khi đánh giá đang hiện; ẩn rồi thì chỉ admin xem. */
  async getReviewPhoto(photoId: string, actor: LifecycleActor | null) {
    const p = await this.d1
      .prepare('SELECT ph.object_key, r.status FROM review_photos ph JOIN reviews r ON r.id = ph.review_id WHERE ph.id = ?')
      .bind(photoId)
      .first<any>();
    if (!p || !this.storage || (p.status !== 'published' && actor?.role !== 'admin')) return fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh.');
    const obj = await this.storage.get(p.object_key);
    if (!obj) return fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh.');
    return { ok: true as const, ...obj, isPublic: p.status === 'published' };
  }

  /** Công khai: đánh giá đang hiện của một cơ sở, mới nhất trước, kèm điểm trung bình. */
  async listingReviews(listingId: string) {
    const [rows, sum] = await Promise.all([
      this.d1
        .prepare(
          `SELECT r.*, p.full_name FROM reviews r JOIN profiles p ON p.id = r.user_id
           WHERE r.listing_id = ? AND r.status = 'published' ORDER BY r.created_at DESC LIMIT 50`
        )
        .bind(listingId)
        .all<any>(),
      this.d1
        .prepare("SELECT COUNT(*) AS n, ROUND(AVG(rating), 1) AS avg FROM reviews WHERE listing_id = ? AND status = 'published'")
        .bind(listingId)
        .first<any>(),
    ]);
    const list = rows.results || [];
    const photos = await this.photosOf(list.map((r: any) => r.id));
    return {
      ok: true as const,
      data: { listingId, count: sum?.n ?? 0, average: sum?.avg ?? 0, items: list.map((r: any) => this.toReview(r, photos.get(r.id) || [], false)) },
    };
  }

  async reply(reviewId: string, actor: LifecycleActor, input: any, now = new Date()) {
    const r = await this.d1.prepare('SELECT r.*, b.booking_code FROM reviews r JOIN bookings b ON b.id = r.booking_id WHERE r.id = ?').bind(reviewId).first<any>();
    if (!r) return fail(404, 'NOT_FOUND', 'Không tìm thấy đánh giá.');
    const parties = await this.parties({ user_id: r.user_id, listing_id: r.listing_id }, actor);
    if (!parties.includes('owner')) return fail(403, 'FORBIDDEN', 'Chỉ chủ cơ sở trả lời đánh giá.');
    if (r.status !== 'published') return fail(409, 'REVIEW_HIDDEN', 'Đánh giá đã bị ẩn.');
    const body = text(input?.reply, 1000);
    if (body.length < 5) return fail(400, 'REPLY_TOO_SHORT', 'Câu trả lời ít nhất 5 ký tự.');
    const nowIso = now.toISOString();
    await this.d1.batch([
      this.d1.prepare('UPDATE reviews SET owner_reply = ?, owner_reply_at = ?, updated_at = ? WHERE id = ?').bind(body, nowIso, nowIso, reviewId),
      notifyUserStmt(this.d1, {
        userId: r.user_id, kind: 'review.reply', bookingId: r.booking_id,
        title: `Cơ sở đã trả lời đánh giá của bạn (đơn ${r.booking_code})`, body: body.slice(0, 200), now: nowIso,
      }),
    ]);
    return { ok: true as const, data: { id: reviewId, ownerReply: body, ownerReplyAt: nowIso } };
  }

  /** Admin ẩn đánh giá (có lý do) và thu hồi điểm đã cộng cho nó bằng dòng bù. Ẩn là quyết định cuối. */
  async hide(reviewId: string, actor: LifecycleActor, input: any, now = new Date()) {
    if (actor.role !== 'admin') return fail(403, 'FORBIDDEN', 'Chỉ admin ẩn đánh giá.');
    const reason = text(input?.reason, 300);
    if (reason.length < 3) return fail(400, 'REASON_REQUIRED', 'Ghi rõ lý do ẩn.');
    const r = await this.d1.prepare('SELECT * FROM reviews WHERE id = ?').bind(reviewId).first<any>();
    if (!r) return fail(404, 'NOT_FOUND', 'Không tìm thấy đánh giá.');
    if (r.status === 'hidden') return { ok: true as const, already: true, data: { id: reviewId } };
    const nowIso = now.toISOString();
    try {
      await this.d1.batch([
        this.d1
          .prepare("UPDATE reviews SET status = 'hidden', hidden_reason = ?, hidden_by = ?, hidden_at = ?, updated_at = ? WHERE id = ? AND status = 'published'")
          .bind(reason, actor.id, nowIso, nowIso, reviewId),
        ...this.holds.assertion('changes() = 1'),
        this.d1
          .prepare(
            `INSERT OR IGNORE INTO points_ledger (id, user_id, source_type, source_id, points, reason, reverses_id, created_by, effective_at, created_at)
             SELECT 'pl_' || lower(hex(randomblob(10))), e.user_id, 'admin_revoke', e.id, -e.points, ?, e.id, ?, e.effective_at, ?
             FROM points_ledger e WHERE e.source_id = ? AND e.source_type IN ('review', 'review_photo')
               AND NOT EXISTS (SELECT 1 FROM points_ledger x WHERE x.reverses_id = e.id)`
          )
          .bind(`Đánh giá bị ẩn: ${reason}`, actor.id, nowIso, reviewId),
        notifyUserStmt(this.d1, {
          userId: r.user_id, kind: 'review.hidden', bookingId: r.booking_id,
          title: 'Đánh giá của bạn đã bị ẩn', body: `Lý do: ${reason}. Điểm Mây của đánh giá này được thu hồi.`, now: nowIso,
        }),
      ]);
    } catch (err: any) {
      if (!/CHECK constraint failed/i.test(String(err?.message))) throw err;
      return { ok: true as const, already: true, data: { id: reviewId } };
    }
    return { ok: true as const, already: false, data: { id: reviewId } };
  }

  async adminReviews(actor: LifecycleActor) {
    if (actor.role !== 'admin') return fail(403, 'FORBIDDEN', 'Chỉ admin.');
    const rows = await this.d1
      .prepare(
        `SELECT r.*, p.full_name, b.booking_code, b.listing_title FROM reviews r JOIN profiles p ON p.id = r.user_id JOIN bookings b ON b.id = r.booking_id
         ORDER BY r.created_at DESC LIMIT 100`
      )
      .all<any>();
    const list = rows.results || [];
    const photos = await this.photosOf(list.map((r: any) => r.id));
    return {
      ok: true as const,
      data: list.map((r: any) => ({ ...this.toReview(r, photos.get(r.id) || [], true), bookingCode: r.booking_code, listingTitle: r.listing_title, authorFullName: r.full_name })),
    };
  }

  // ================= Khiếu nại =================

  private toComplaint(c: any) {
    return {
      id: c.id,
      status: c.status as ComplaintStatus,
      outcome: (c.outcome ?? null) as ComplaintOutcome | null,
      category: c.category,
      categoryLabel: COMPLAINT_CATEGORIES[c.category] || c.category,
      description: c.description,
      ownerResponse: c.owner_response ?? null,
      assignedAt: c.assigned_at ?? null,
      conclusion: (c.conclusion ?? null) as Conclusion | null,
      conclusionNote: c.conclusion_note ?? null,
      concludedAt: c.concluded_at ?? null,
      refundAmount: c.refund_amount ?? null,
      refundDueAt: c.refund_due_at ?? null,
      refundReportedAmount: c.refund_reported_amount ?? null,
      closedAt: c.closed_at ?? null,
      createdAt: c.created_at,
    };
  }

  private latestComplaint(bookingId: string) {
    return this.d1.prepare('SELECT * FROM complaints WHERE booking_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1').bind(bookingId).first<any>();
  }

  async complaintView(bookingId: string, actor: LifecycleActor, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    if (parties.length === 0) return fail(403, 'FORBIDDEN', 'Bạn không có quyền với đơn này.');
    const c = await this.latestComplaint(bookingId);
    const canOpen = canOpenComplaint({ status: b.status, confirmedAt: b.confirmed_at, checkOutDate: b.check_out_date }, parties, now.getTime());
    const [files, events] = c
      ? await Promise.all([
          this.d1.prepare('SELECT id, role, created_at FROM complaint_files WHERE complaint_id = ? ORDER BY created_at, rowid').bind(c.id).all<any>(),
          this.d1
            .prepare('SELECT action, from_status, to_status, actor_role, note, created_at FROM complaint_events WHERE complaint_id = ? ORDER BY created_at, rowid')
            .bind(c.id)
            .all<any>(),
        ])
      : [{ results: [] }, { results: [] }];
    return {
      ok: true as const,
      data: {
        bookingId,
        bookingCode: b.booking_code,
        totalAmount: b.total_amount,
        parties,
        complaint: c ? this.toComplaint(c) : null,
        canOpen: (!c || c.status === 'closed') && canOpen.ok,
        openBlockedReason: canOpen.ok ? null : canOpen.message,
        openDeadline: complaintDeadline(b.check_out_date).toISOString(),
        refundOverdue: !!c && c.status === 'refund_pending' && !!c.refund_due_at && now.getTime() >= Date.parse(c.refund_due_at),
        categories: COMPLAINT_CATEGORIES,
        files: ((files as any).results || []).map((f: any) => ({ id: f.id, role: f.role, createdAt: f.created_at })),
        events: ((events as any).results || []).map((e: any) => ({
          action: e.action, fromStatus: e.from_status, toStatus: e.to_status, actorRole: e.actor_role, note: e.note, createdAt: e.created_at,
        })),
      },
    };
  }

  async openComplaint(bookingId: string, actor: LifecycleActor, input: any, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    const check = canOpenComplaint({ status: b.status, confirmedAt: b.confirmed_at, checkOutDate: b.check_out_date }, parties, now.getTime());
    if (!check.ok) return fail(check.status, check.code, check.message);
    const category = String(input?.category || '');
    if (!(category in COMPLAINT_CATEGORIES)) return fail(400, 'INVALID_CATEGORY', 'Chọn loại vấn đề.');
    const description = text(input?.description, 3000);
    if (description.length < 20) return fail(400, 'DESCRIPTION_TOO_SHORT', 'Mô tả ít nhất 20 ký tự: chuyện gì xảy ra, khi nào, bạn mong được giải quyết thế nào.');
    const id = rid('cp');
    const nowIso = now.toISOString();
    const title = `Đơn ${b.booking_code}: khách mở khiếu nại`;
    const body = `${COMPLAINT_CATEGORIES[category]}. ${description.slice(0, 160)}`;
    try {
      await this.d1.batch([
        this.d1
          .prepare(
            `INSERT INTO complaints (id, booking_id, user_id, listing_id, category, description, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`
          )
          .bind(id, bookingId, b.user_id, b.listing_id, category, description, nowIso, nowIso),
        this.d1
          .prepare('INSERT INTO complaint_events (id, complaint_id, action, from_status, to_status, actor_id, actor_role, note, created_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)')
          .bind(rid('ce'), id, 'open', 'open', actor.id, actor.role, description, nowIso),
        notifyOwnersStmt(this.d1, { listingId: b.listing_id, kind: 'complaint.open', bookingId, title, body: `${body} Bạn có thể trả lời và gửi ảnh bằng chứng.`, now: nowIso }),
        notifyAdminsStmt(this.d1, { kind: 'complaint.open', bookingId, title, body, now: nowIso }),
      ]);
    } catch (err: any) {
      if (/UNIQUE constraint failed/i.test(String(err?.message))) return fail(409, 'COMPLAINT_EXISTS', 'Đơn này đang có khiếu nại chưa đóng.');
      throw err;
    }
    return this.complaintView(bookingId, actor, now);
  }

  async uploadComplaintFile(bookingId: string, actor: LifecycleActor, bytes: Uint8Array, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    const role: Party | null = parties.includes('owner') ? 'owner' : parties.includes('guest') ? 'guest' : parties.includes('admin') ? 'admin' : null;
    if (!role) return fail(403, 'FORBIDDEN', 'Bạn không có quyền với đơn này.');
    const c = await this.latestComplaint(bookingId);
    if (!c) return fail(409, 'NO_COMPLAINT', 'Đơn này chưa có khiếu nại.');
    if (c.status === 'closed') return fail(409, 'CLOSED', 'Khiếu nại đã đóng.');
    const saved = await this.savePhoto(`complaints/${c.id}`, bytes);
    if ('ok' in saved) return saved;
    const nowIso = now.toISOString();
    const res = await this.d1
      .prepare(
        `INSERT INTO complaint_files (id, complaint_id, role, object_key, content_type, size_bytes, uploaded_by, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM complaint_files WHERE complaint_id = ? AND role = ?) < ?`
      )
      .bind(saved.id, c.id, role, saved.key, saved.type, bytes.length, actor.id, nowIso, c.id, role, MAX_COMPLAINT_FILES_PER_SIDE)
      .run();
    if (!Number(res?.meta?.changes ?? 0)) {
      await this.storage!.delete(saved.key);
      return fail(409, 'TOO_MANY_FILES', `Mỗi bên gửi tối đa ${MAX_COMPLAINT_FILES_PER_SIDE} ảnh.`);
    }
    return { ok: true as const, data: { id: saved.id, role, createdAt: nowIso } };
  }

  async getComplaintFile(bookingId: string, fileId: string, actor: LifecycleActor) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    if ((await this.parties(b, actor)).length === 0) return fail(403, 'FORBIDDEN', 'Bạn không có quyền xem ảnh này.');
    const f = await this.d1
      .prepare('SELECT f.object_key FROM complaint_files f JOIN complaints c ON c.id = f.complaint_id WHERE f.id = ? AND c.booking_id = ?')
      .bind(fileId, bookingId)
      .first<any>();
    if (!f || !this.storage) return fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh.');
    const obj = await this.storage.get(f.object_key);
    if (!obj) return fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh.');
    return { ok: true as const, ...obj };
  }

  async complaintAct(bookingId: string, action: ComplaintAction, actor: LifecycleActor, input: any = {}, now = new Date()) {
    const b = await this.booking(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.parties(b, actor);
    if (parties.length === 0) return fail(403, 'FORBIDDEN', 'Bạn không có quyền với đơn này.');
    const c = await this.latestComplaint(bookingId);
    if (!c) return fail(409, 'NO_COMPLAINT', 'Đơn này chưa có khiếu nại.');
    const note = text(input?.note, 1000);
    const conclusion = input?.conclusion as Conclusion | undefined;
    const refundAmount = input?.refundAmount === undefined || input?.refundAmount === '' ? 0 : Number(input.refundAmount);
    // Chứng từ hoàn: ảnh của cơ sở gửi trong đợt chờ hoàn hiện tại.
    const cycleStart = c.refund_due_at ? new Date(Date.parse(c.refund_due_at) - REFUND_DUE_MS).toISOString() : c.created_at;
    const proofs = await this.d1
      .prepare("SELECT COUNT(*) AS n FROM complaint_files WHERE complaint_id = ? AND role = 'owner' AND created_at >= ?")
      .bind(c.id, cycleStart)
      .first<{ n: number }>();
    const decideCtx = { now: now.getTime(), refundProofs: proofs?.n ?? 0, conclusion, refundAmount };
    const d = complaintDecide(action, { status: c.status, refundDueAt: c.refund_due_at, outcome: c.outcome }, parties, decideCtx);
    if (d.kind === 'deny') return fail(d.status, d.code, d.message);
    if (d.kind === 'already') return { ok: true as const, already: true, data: ((await this.complaintView(bookingId, actor, now)) as any).data };

    const needNote: ComplaintAction[] = ['respond', 'conclude', 'refund_not_received', 'admin_confirm_refund', 'require_refund'];
    if (needNote.includes(action) && note.length < 3) return fail(400, 'NOTE_REQUIRED', 'Vui lòng ghi rõ nội dung (lưu vào lịch sử khiếu nại).');
    if (action === 'conclude' && refundAmount > b.total_amount) return fail(400, 'INVALID_REFUND', 'Số tiền hoàn không quá tổng tiền đơn.');
    let reported: number | null = null;
    if (action === 'report_refund') {
      reported = Number(input?.amount);
      if (!Number.isInteger(reported) || reported <= 0 || reported > b.total_amount) return fail(400, 'INVALID_AMOUNT', 'Số tiền đã hoàn là số nguyên dương, không quá tổng đơn.');
    }

    const nowIso = now.toISOString();
    const set: [string, unknown][] = [['status', d.to], ['updated_at', nowIso]];
    if (d.outcome) set.push(['outcome', d.outcome], ['closed_at', nowIso]);
    if (d.newRefundDueAt) set.push(['refund_due_at', d.newRefundDueAt]);
    if (action === 'assign') set.push(['assigned_to', actor.id], ['assigned_at', nowIso]);
    if (action === 'respond') set.push(['owner_response', note], ['owner_response_at', nowIso]);
    if (action === 'conclude') set.push(['conclusion', conclusion], ['conclusion_note', note], ['concluded_by', actor.id], ['concluded_at', nowIso], ['refund_amount', refundAmount]);
    if (action === 'report_refund') set.push(['refund_reported_amount', reported]);

    const code = b.booking_code;
    const MSG: Record<ComplaintAction, string> = {
      assign: 'Tà Xùa Trip đã nhận xử lý khiếu nại và đang xem bằng chứng của hai bên.',
      respond: `Cơ sở trả lời: ${note}`,
      withdraw: 'Khách đã rút khiếu nại.',
      conclude:
        d.to === 'refund_pending'
          ? `Kết luận: khách đúng. Cơ sở hoàn ${vnd(refundAmount)} đ trong 3 ngày và tải ảnh chứng từ. ${note}`
          : `Kết luận: ${conclusion === 'upheld' ? 'khách đúng, không cần hoàn tiền' : 'không chấp nhận khiếu nại'}. ${note}`,
      report_refund: `Cơ sở báo đã hoàn ${reported ? vnd(reported) : ''} đ (có ảnh chứng từ). Kiểm tài khoản rồi xác nhận đã nhận hoặc báo chưa nhận.`,
      confirm_refund: 'Khách xác nhận đã nhận tiền hoàn. Khiếu nại đã đóng.',
      refund_not_received: `Khách báo chưa nhận được tiền hoàn: ${note}`,
      admin_confirm_refund: `Tà Xùa Trip xác nhận cơ sở đã hoàn theo chứng từ. ${note}`,
      require_refund: `Tà Xùa Trip yêu cầu cơ sở hoàn trong 3 ngày. ${note}`,
    };
    const title = `Đơn ${code}: khiếu nại`;
    const stmts: any[] = [
      this.d1.prepare(`UPDATE complaints SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ? AND status = ?`).bind(...set.map(([, v]) => v), c.id, d.from),
      ...this.holds.assertion('changes() = 1'),
      this.d1
        .prepare('INSERT INTO complaint_events (id, complaint_id, action, from_status, to_status, actor_id, actor_role, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(rid('ce'), c.id, action, d.from, d.to, actor.id, actor.role, note || (reported ? String(reported) : action === 'conclude' ? String(refundAmount) : null), nowIso),
    ];
    const toGuest: ComplaintAction[] = ['assign', 'respond', 'conclude', 'report_refund', 'admin_confirm_refund', 'require_refund'];
    const toOwner: ComplaintAction[] = ['assign', 'withdraw', 'conclude', 'confirm_refund', 'refund_not_received', 'admin_confirm_refund', 'require_refund'];
    const toAdmin: ComplaintAction[] = ['withdraw', 'respond', 'report_refund', 'confirm_refund', 'refund_not_received'];
    if (toGuest.includes(action)) stmts.push(notifyUserStmt(this.d1, { userId: b.user_id, kind: `complaint.${action}`, bookingId, title, body: MSG[action], now: nowIso }));
    if (toOwner.includes(action)) stmts.push(notifyOwnersStmt(this.d1, { listingId: b.listing_id, kind: `complaint.${action}`, bookingId, title, body: MSG[action], now: nowIso }));
    if (toAdmin.includes(action)) stmts.push(notifyAdminsStmt(this.d1, { kind: `complaint.${action}`, bookingId, title, body: MSG[action], now: nowIso }));
    try {
      await this.d1.batch(stmts);
    } catch (err: any) {
      if (!/CHECK constraint failed/i.test(String(err?.message))) throw err;
      // Bước khác vừa đổi khiếu nại: đọc lại; nếu đã ở đúng bước này thì trả "đã làm".
      const fresh = await this.latestComplaint(bookingId);
      const again = complaintDecide(action, { status: fresh.status, refundDueAt: fresh.refund_due_at, outcome: fresh.outcome }, parties, decideCtx);
      if (again.kind === 'already') return { ok: true as const, already: true, data: ((await this.complaintView(bookingId, actor, now)) as any).data };
      if (again.kind === 'deny') return fail(again.status, again.code, again.message);
      return fail(409, 'CONFLICT', 'Khiếu nại vừa thay đổi, vui lòng tải lại.');
    }
    return { ok: true as const, already: false, data: ((await this.complaintView(bookingId, actor, now)) as any).data };
  }

  async adminComplaints(actor: LifecycleActor) {
    if (actor.role !== 'admin') return fail(403, 'FORBIDDEN', 'Chỉ admin xem danh sách khiếu nại.');
    const r = await this.d1
      .prepare(
        `SELECT c.*, b.booking_code, b.listing_title, b.guest_name, b.guest_phone, b.total_amount
         FROM complaints c JOIN bookings b ON b.id = c.booking_id
         ORDER BY CASE c.status WHEN 'refund_disputed' THEN 0 WHEN 'open' THEN 1 WHEN 'in_review' THEN 2 WHEN 'refund_pending' THEN 3 WHEN 'refund_reported' THEN 4 ELSE 5 END,
                  c.created_at DESC
         LIMIT 200`
      )
      .all<any>();
    return {
      ok: true as const,
      data: (r.results || []).map((c: any) => ({
        bookingId: c.booking_id, bookingCode: c.booking_code, listingTitle: c.listing_title, guestName: c.guest_name, guestPhone: c.guest_phone,
        totalAmount: c.total_amount, ...this.toComplaint(c),
      })),
    };
  }
}
