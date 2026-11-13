/**
 * N05.3 — Vòng đời đơn trên server: xác nhận, từ chối, nhận phòng (QR), hoàn tất, hủy; lịch sử; danh sách.
 *
 * Mỗi lần đổi trạng thái là MỘT batch D1: UPDATE có điều kiện đúng trạng thái nguồn → kiểm changes() = 1
 * (CHECK lỗi thì cả batch hủy) → cập nhật các đêm giữ phòng → ghi lịch sử → thông báo. Hai yêu cầu cùng lúc:
 * chỉ một yêu cầu qua được UPDATE; yêu cầu kia đọc lại thấy trạng thái đích và trả "đã làm".
 */
import type { D1Database } from '../d1.ts';
import { todayInVietnam } from '../../search/searchIntent.ts';
import { ListingStore } from '../listings/store.ts';
import { balanceDueAt } from '../../config/payment.ts';
import { BOOKING_COLUMNS, HoldStore, notifyUserStmt, viDate, bookingEventStmt, notifyOwnersStmt, toBookingView, type BookingView } from './holds.ts';
import { openReconciliationStmts } from '../payments/reconciliation.ts';
import { completionLedgerStmts } from '../community/ledger.ts';
import { decide, type BookingAction, type BookingStatus, type Party } from './lifecycle.ts';

export interface LifecycleActor {
  id: string;
  role: 'traveler' | 'partner' | 'admin';
  providerId?: string | null;
}

export type ActResult =
  | { ok: true; already: boolean; booking: BookingView }
  | { ok: false; status: number; code: string; message: string };

export interface BookingEvent {
  action: string;
  fromStatus: string | null;
  toStatus: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
}

export const CHECKIN_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function newCheckinToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const fail = (status: number, code: string, message: string): ActResult => ({ ok: false, status, code, message });

export class BookingLifecycle {
  private holds: HoldStore;
  private listings: ListingStore;

  constructor(private d1: D1Database) {
    this.holds = new HoldStore(d1);
    this.listings = new ListingStore(d1);
  }

  private async row(id: string) {
    return this.d1.prepare(`SELECT ${BOOKING_COLUMNS}, checkin_token FROM bookings WHERE id = ?`).bind(id).first<any>();
  }

  async partiesOf(row: { user_id: string; listing_id: string }, actor: LifecycleActor): Promise<Party[]> {
    const parties: Party[] = [];
    if (row.user_id === actor.id) parties.push('guest');
    if (actor.role === 'partner' && (await this.listings.isOwnedBy(row.listing_id, actor.providerId ?? undefined))) parties.push('owner');
    if (actor.role === 'admin') parties.push('admin');
    return parties;
  }

  private decision(action: BookingAction, row: any, parties: Party[], now: Date) {
    return decide(action, row.status as BookingStatus, parties, {
      today: todayInVietnam(now),
      checkIn: row.check_in_date,
      checkOut: row.check_out_date,
      holdExpired: row.status === 'pending_deposit' && !!row.hold_expires_at && Date.parse(row.hold_expires_at) <= now.getTime(),
      balanceOverdue: now.getTime() >= balanceDueAt(row.check_in_date).getTime(),
      balancePaid: !!row.balance_confirmed_at,
    });
  }

  async act(bookingId: string, action: BookingAction, actor: LifecycleActor, opts: { reason?: string } = {}, now: Date = new Date()): Promise<ActResult> {
    const row = await this.row(bookingId);
    if (!row) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.partiesOf(row, actor);
    const d = this.decision(action, row, parties, now);
    if (d.kind === 'deny') return d.status === 403 && parties.length === 0 ? fail(403, 'FORBIDDEN', 'Bạn không có quyền với đơn này.') : fail(d.status, d.code, d.message);
    if (d.kind === 'already') return { ok: true, already: true, booking: toBookingView(row) };

    const nowIso = now.toISOString();
    const reason = action === 'release'
      ? `Quá hạn trả 70% trước giờ nhận phòng 24 giờ (D03), cọc không hoàn.${opts.reason?.trim() ? ` ${opts.reason.trim()}` : ''}`
      : opts.reason?.trim() || null;
    const actorRef = { id: actor.id, role: actor.role };
    const holdCond = (d.from === 'pending_deposit' ? ' AND hold_expires_at > ?' : '') + (action === 'release' ? ' AND balance_confirmed_at IS NULL' : '');
    const holdArgs = d.from === 'pending_deposit' ? [nowIso] : [];
    const fields: [string, unknown][] = [['status', d.to], ['updated_at', nowIso]];
    if (action === 'confirm') fields.push(['confirmed_at', nowIso], ['checkin_token', newCheckinToken()]);
    if (action === 'check_in') fields.push(['checked_in_at', nowIso]);
    if (action === 'complete') fields.push(['completed_at', nowIso]);
    if (d.to === 'cancelled') fields.push(['cancelled_at', nowIso], ['cancel_reason', reason]);
    const set = fields.map(([c]) => `${c} = ?`);
    const setArgs = fields.map(([, v]) => v);

    const stmts = [
      this.d1
        .prepare(`UPDATE bookings SET ${set.join(', ')} WHERE id = ? AND status = ?${holdCond}`)
        .bind(...setArgs, bookingId, d.from, ...holdArgs),
      ...this.holds.assertion('changes() = 1'),
    ];
    if (action === 'confirm') {
      stmts.push(
        this.d1
          .prepare(`UPDATE room_night_allocations SET status = 'confirmed', expires_at = NULL, updated_at = ? WHERE source_id = ? AND status = 'held' AND expires_at > ?`)
          .bind(nowIso, bookingId, nowIso),
        ...this.holds.assertion(`(SELECT COUNT(*) FROM room_night_allocations WHERE source_id = ? AND status != 'confirmed') = 0`, bookingId)
      );
    } else if (action === 'complete') {
      // N06.2: Điểm Mây cho khách + nghĩa vụ phí nền tảng, cùng batch (hoàn tất lặp/đồng thời chỉ ghi một lần).
      stmts.push(...completionLedgerStmts(this.d1, bookingId, now));
    } else if (action === 'check_in') {
      stmts.push(this.d1.prepare(`UPDATE room_night_allocations SET status = 'checked_in', updated_at = ? WHERE source_id = ? AND status = 'confirmed'`).bind(nowIso, bookingId));
    } else if (d.to === 'cancelled') {
      stmts.push(this.d1.prepare(`UPDATE room_night_allocations SET status = 'released', updated_at = ? WHERE source_id = ? AND status IN ('held', 'confirmed')`).bind(nowIso, bookingId));
    }
    stmts.push(bookingEventStmt(this.d1, { bookingId, action, from: d.from, to: d.to, actor: actorRef, reason, now: nowIso }));
    if (action === 'reject') {
      // Khách đã gửi biên lai cọc mà cơ sở từ chối → mở đối soát (hoàn trong 3 ngày hoặc giữ khi khách đồng ý).
      stmts.push(...openReconciliationStmts(this.d1, { where: 'b.id = ?', params: [bookingId], nowIso, reason: 'cơ sở đã từ chối đơn' }));
    }
    if (action === 'release' || action === 'reject') {
      stmts.push(
        notifyUserStmt(this.d1, {
          userId: row.user_id,
          kind: action === 'release' ? 'booking.released' : 'booking.rejected',
          bookingId,
          title: `Đơn ${row.booking_code} đã bị ${action === 'release' ? 'nhả phòng' : 'từ chối'}`,
          body: reason || '',
          now: nowIso,
        })
      );
    }
    if (action === 'cancel') {
      stmts.push(
        notifyOwnersStmt(this.d1, {
          listingId: row.listing_id,
          kind: 'booking.cancelled',
          bookingId,
          title: `Đơn ${row.booking_code} đã hủy`,
          body: `${parties.includes('guest') ? 'Khách' : 'Tà Xùa Trip'} hủy đơn ${viDate(row.check_in_date)} → ${viDate(row.check_out_date)}. Phòng đã được trả lại.${reason ? ` Lý do: ${reason}` : ''}`,
          now: nowIso,
        })
      );
    }

    try {
      await this.d1.batch(stmts);
    } catch (err: any) {
      if (!/CHECK constraint failed/i.test(String(err?.message))) throw err;
      // Batch đã hủy toàn bộ: có yêu cầu khác đổi trạng thái trước, hoặc giữ chỗ vừa hết hạn.
      const fresh = await this.row(bookingId);
      const again = this.decision(action, fresh, parties, now);
      if (again.kind === 'already') return { ok: true, already: true, booking: toBookingView(fresh) };
      if (again.kind === 'deny') return fail(again.status, again.code, again.message);
      return fail(409, 'CONFLICT', 'Đơn vừa thay đổi, vui lòng tải lại.');
    }
    return { ok: true, already: false, booking: toBookingView((await this.row(bookingId))!) };
  }

  private async rowByToken(token: string) {
    if (!CHECKIN_TOKEN_RE.test(token)) return null;
    return this.d1.prepare(`SELECT ${BOOKING_COLUMNS}, checkin_token FROM bookings WHERE checkin_token = ?`).bind(token).first<any>();
  }

  /** Kiểm mã QR cho chủ cơ sở/admin: mã sai → 404, cơ sở khác → 403. */
  private async tokenAccess(token: string, actor: LifecycleActor): Promise<{ ok: true; row: any } | { ok: false; status: number; code: string; message: string }> {
    const row = await this.rowByToken(token);
    if (!row) return { ok: false, status: 404, code: 'QR_INVALID', message: 'Mã nhận phòng không hợp lệ.' };
    const parties = await this.partiesOf(row, actor);
    if (!parties.includes('owner') && !parties.includes('admin')) {
      return actor.role === 'partner'
        ? { ok: false, status: 403, code: 'QR_WRONG_LISTING', message: 'Mã này thuộc đơn của cơ sở khác.' }
        : { ok: false, status: 403, code: 'FORBIDDEN', message: 'Chỉ chủ cơ sở xác nhận nhận phòng.' };
    }
    return { ok: true, row };
  }

  async previewByToken(token: string, actor: LifecycleActor) {
    const a = await this.tokenAccess(token, actor);
    if (!a.ok) return a;
    const b = toBookingView(a.row);
    return {
      ok: true as const,
      data: {
        id: b.id, bookingCode: b.bookingCode, listingTitle: b.listingTitle, guestName: b.guestName, guestPhone: b.guestPhone,
        roomName: b.roomName, rooms: b.rooms, adults: b.adults, children: b.children,
        checkInDate: b.checkInDate, checkOutDate: b.checkOutDate, status: b.status,
      },
    };
  }

  async checkInByToken(token: string, actor: LifecycleActor, now: Date = new Date()): Promise<ActResult> {
    const a = await this.tokenAccess(token, actor);
    if (!a.ok) return a;
    return this.act(a.row.id, 'check_in', actor, {}, now);
  }

  async detail(bookingId: string, actor: LifecycleActor) {
    const row = await this.row(bookingId);
    if (!row) return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy đơn.' };
    const parties = await this.partiesOf(row, actor);
    if (parties.length === 0) return { ok: false as const, status: 403, code: 'FORBIDDEN', message: 'Bạn không có quyền xem đơn này.' };
    const ev = await this.d1
      .prepare('SELECT action, from_status, to_status, actor_role, reason, created_at FROM booking_events WHERE booking_id = ? ORDER BY created_at, rowid')
      .bind(bookingId)
      .all<any>();
    const events: BookingEvent[] = (ev.results || []).map((e: any) => ({
      action: e.action, fromStatus: e.from_status, toStatus: e.to_status, actorRole: e.actor_role, reason: e.reason, createdAt: e.created_at,
    }));
    // Mã QR chỉ trả cho khách chủ đơn, và chỉ khi đơn đã xác nhận (chưa nhận phòng).
    const checkinToken = parties.includes('guest') && row.status === 'confirmed' ? row.checkin_token : null;
    return { ok: true as const, data: { ...toBookingView(row), events, checkinToken } };
  }

  async listForUser(userId: string): Promise<BookingView[]> {
    const r = await this.d1.prepare(`SELECT ${BOOKING_COLUMNS} FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`).bind(userId).all<any>();
    return (r.results || []).map(toBookingView);
  }

  async listForOwner(actor: LifecycleActor, listingId?: string): Promise<BookingView[]> {
    const cols =
      BOOKING_COLUMNS.split(',').map((c) => `b.${c.trim()}`).join(', ') +
      `, b.confirmed_at,
       (SELECT COUNT(*) FROM payment_receipts r WHERE r.booking_id = b.id AND r.kind = 'deposit') AS deposit_receipts,
       (SELECT COUNT(*) FROM payment_receipts r WHERE r.booking_id = b.id AND r.kind = 'balance') AS balance_receipts,
       (SELECT x.status FROM payment_reconciliations x WHERE x.booking_id = b.id) AS recon_status,
       (SELECT x.due_at FROM payment_reconciliations x WHERE x.booking_id = b.id) AS recon_due_at,
       (SELECT c.status FROM complaints c WHERE c.booking_id = b.id ORDER BY c.created_at DESC, c.rowid DESC LIMIT 1) AS complaint_status`;
    const filter = listingId ? ' AND b.listing_id = ?' : '';
    const args: unknown[] = listingId ? [listingId] : [];
    const r =
      actor.role === 'admin'
        ? await this.d1.prepare(`SELECT ${cols} FROM bookings b WHERE 1 = 1${filter} ORDER BY b.created_at DESC LIMIT 200`).bind(...args).all<any>()
        : await this.d1
            .prepare(
              `SELECT ${cols} FROM bookings b JOIN provider_listings pl ON pl.listing_id = b.listing_id AND pl.provider_id = ?
               WHERE 1 = 1${filter} ORDER BY b.created_at DESC LIMIT 200`
            )
            .bind(actor.providerId ?? '', ...args)
            .all<any>();
    return (r.results || []).map((row: any) => ({
      ...toBookingView(row),
      depositReceipts: row.deposit_receipts ?? 0,
      balanceReceipts: row.balance_receipts ?? 0,
      // Đối soát cọc đang mở (khách đã gửi biên lai nhưng đơn hết hạn/bị từ chối trước khi cơ sở xác nhận).
      reconStatus: row.recon_status ?? null,
      reconDueAt: row.recon_due_at ?? null,
      needsReconciliation: !!row.recon_status && row.recon_status !== 'closed',
      // N06.3: khiếu nại gần nhất của đơn (null = chưa có)
      complaintStatus: row.complaint_status ?? null,
    }));
  }
}

export interface NotificationItem {
  id: string;
  kind: string;
  bookingId: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export class NotificationStore {
  constructor(private d1: D1Database) {}

  async list(userId: string): Promise<{ unread: number; items: NotificationItem[] }> {
    const [items, unread] = await Promise.all([
      this.d1
        .prepare('SELECT id, kind, booking_id, title, body, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 50')
        .bind(userId)
        .all<any>(),
      this.d1.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL').bind(userId).first<{ n: number }>(),
    ]);
    return {
      unread: unread?.n ?? 0,
      items: (items.results || []).map((r: any) => ({
        id: r.id, kind: r.kind, bookingId: r.booking_id, title: r.title, body: r.body, createdAt: r.created_at, read: !!r.read_at,
      })),
    };
  }

  async markRead(userId: string, ids: string[] | 'all', now: Date = new Date()): Promise<void> {
    const nowIso = now.toISOString();
    if (ids === 'all') {
      await this.d1.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').bind(nowIso, userId).run();
      return;
    }
    for (const id of ids.slice(0, 100)) {
      await this.d1.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL').bind(nowIso, id, userId).run();
    }
  }
}
