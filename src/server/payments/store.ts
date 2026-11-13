/**
 * N06.1 — Thanh toán theo D03: cọc chuyển thẳng tài khoản cơ sở, cơ sở xác nhận thủ công (có log).
 * Không có cổng thanh toán, không webhook. Mọi màn đọc cùng một snapshot (booking_payments).
 */
import type { D1Database } from '../d1.ts';
import {
  TERMS_POINTS, TERMS_VERSION, CHECKIN_HOUR_VN, BALANCE_REMINDER_HOURS, balanceDueAt, normalizeAccountName, transferMemo,
} from '../../config/payment.ts';
import { bankByBin, buildVietQr, isValidAccountNumber } from '../../payment/vietqr.ts';
import { BookingLifecycle, type LifecycleActor } from '../bookings/store.ts';
import { HoldStore, bookingEventStmt, notifyOwnersStmt, notifyUserStmt } from '../bookings/holds.ts';
import type { PrivateStorage } from './storage.ts';

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const MAX_RECEIPTS_PER_KIND = 3;

export type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });

export interface PayoutAccount {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentSnapshot {
  bookingId: string;
  bookingCode: string;
  payeeBankBin: string;
  payeeBankName: string;
  payeeAccountNumber: string;
  payeeAccountName: string;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  depositMemo: string;
  balanceMemo: string;
  balanceDueAt: string;
  termsVersion: string;
  /** Chuỗi VietQR (NAPAS) — ứng dụng ngân hàng đọc ra người nhận, số tiền, nội dung */
  vietQrDeposit: string;
  vietQrBalance: string;
}

/** Nhận dạng ảnh theo byte đầu file (không tin Content-Type/đuôi file). */
export function detectImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return 'image/png';
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

const rid = (prefix: string) => `${prefix}_${Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, '0')).join('')}`;

export class PaymentStore {
  private lifecycle: BookingLifecycle;
  private holds: HoldStore;

  constructor(private d1: D1Database, private storage?: PrivateStorage) {
    this.lifecycle = new BookingLifecycle(d1);
    this.holds = new HoldStore(d1);
  }

  // ---------- Tài khoản nhận cọc của cơ sở ----------

  private async canManageListing(listingId: string, actor: LifecycleActor) {
    if (actor.role === 'admin') return true;
    return this.lifecycle.partiesOf({ user_id: '', listing_id: listingId }, actor).then((p) => p.includes('owner'));
  }

  async getPayout(listingId: string, actor: LifecycleActor): Promise<{ ok: true; data: PayoutAccount | null } | Fail> {
    if (!(await this.canManageListing(listingId, actor))) return fail(403, 'FORBIDDEN', 'Chỉ chủ cơ sở xem được tài khoản nhận cọc.');
    const r = await this.d1.prepare('SELECT bank_bin, account_number, account_name FROM listing_payout_accounts WHERE listing_id = ?').bind(listingId).first<any>();
    return { ok: true, data: r ? { bankBin: r.bank_bin, bankName: bankByBin(r.bank_bin)?.short || r.bank_bin, accountNumber: r.account_number, accountName: r.account_name } : null };
  }

  async setPayout(listingId: string, actor: LifecycleActor, input: any, now = new Date()): Promise<{ ok: true; data: PayoutAccount } | Fail> {
    if (!(await this.canManageListing(listingId, actor))) return fail(403, 'FORBIDDEN', 'Chỉ chủ cơ sở cập nhật được tài khoản nhận cọc.');
    const bankBin = String(input?.bankBin || '');
    const accountNumber = String(input?.accountNumber || '').replace(/\s/g, '');
    const accountName = normalizeAccountName(String(input?.accountName || '')).slice(0, 70);
    const bank = bankByBin(bankBin);
    if (!bank) return fail(400, 'INVALID_BANK', 'Vui lòng chọn ngân hàng trong danh sách.');
    if (!isValidAccountNumber(accountNumber)) return fail(400, 'INVALID_ACCOUNT', 'Số tài khoản gồm 6–19 chữ số.');
    if (!/^[A-Z ]{2,}$/.test(accountName)) return fail(400, 'INVALID_ACCOUNT_NAME', 'Nhập tên chủ tài khoản như trên app ngân hàng.');
    const nowIso = now.toISOString();
    await this.d1.batch([
      this.d1
        .prepare(
          `INSERT INTO listing_payout_accounts (listing_id, bank_bin, account_number, account_name, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(listing_id) DO UPDATE SET bank_bin = excluded.bank_bin, account_number = excluded.account_number,
             account_name = excluded.account_name, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
        )
        .bind(listingId, bankBin, accountNumber, accountName, actor.id, nowIso),
      this.d1
        .prepare('INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(rid('au'), actor.id, actor.role, 'listing.payout_account', 'listing', listingId, JSON.stringify({ bankBin, accountLast4: accountNumber.slice(-4) }), nowIso),
    ]);
    return { ok: true, data: { bankBin, bankName: bank.short, accountNumber, accountName } };
  }

  // ---------- Thông tin thanh toán của đơn ----------

  private async bookingRow(id: string) {
    return this.d1
      .prepare('SELECT id, booking_code, user_id, listing_id, status, check_in_date, total_amount, deposit_amount, hold_expires_at, confirmed_at, balance_confirmed_at FROM bookings WHERE id = ?')
      .bind(id)
      .first<any>();
  }

  private toSnapshot(r: any): PaymentSnapshot {
    return {
      bookingId: r.booking_id,
      bookingCode: r.booking_code,
      payeeBankBin: r.payee_bank_bin,
      payeeBankName: bankByBin(r.payee_bank_bin)?.short || r.payee_bank_bin,
      payeeAccountNumber: r.payee_account_number,
      payeeAccountName: r.payee_account_name,
      totalAmount: r.total_amount,
      depositAmount: r.deposit_amount,
      balanceAmount: r.balance_amount,
      depositMemo: r.deposit_memo,
      balanceMemo: r.balance_memo,
      balanceDueAt: r.balance_due_at,
      termsVersion: r.terms_version,
      vietQrDeposit: buildVietQr({ bin: r.payee_bank_bin, accountNumber: r.payee_account_number, amount: r.deposit_amount, memo: r.deposit_memo }),
      vietQrBalance: buildVietQr({ bin: r.payee_bank_bin, accountNumber: r.payee_account_number, amount: r.balance_amount, memo: r.balance_memo }),
    };
  }

  async view(bookingId: string, actor: LifecycleActor, now = new Date()) {
    const b = await this.bookingRow(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.lifecycle.partiesOf(b, actor);
    if (parties.length === 0) return fail(403, 'FORBIDDEN', 'Bạn không có quyền xem thanh toán của đơn này.');
    const [snap, payout, receipts] = await Promise.all([
      this.d1.prepare('SELECT p.*, b.booking_code FROM booking_payments p JOIN bookings b ON b.id = p.booking_id WHERE p.booking_id = ?').bind(bookingId).first<any>(),
      this.d1.prepare('SELECT 1 AS ok FROM listing_payout_accounts WHERE listing_id = ?').bind(b.listing_id).first<any>(),
      this.d1.prepare('SELECT id, kind, content_type, created_at FROM payment_receipts WHERE booking_id = ? ORDER BY created_at, rowid').bind(bookingId).all<any>(),
    ]);
    const due = balanceDueAt(b.check_in_date);
    return {
      ok: true as const,
      data: {
        bookingId,
        status: b.status,
        termsVersion: TERMS_VERSION,
        termsPoints: TERMS_POINTS,
        termsAccepted: !!snap,
        payoutReady: !!payout,
        // Khách chỉ thấy người nhận/số tài khoản sau khi tick điều khoản (snapshot chỉ có từ lúc đó).
        snapshot: snap ? this.toSnapshot(snap) : null,
        receipts: (receipts.results || []).map((r: any) => ({ id: r.id, kind: r.kind, contentType: r.content_type, createdAt: r.created_at })),
        depositConfirmedAt: b.confirmed_at ?? null,
        balanceConfirmedAt: b.balance_confirmed_at ?? null,
        balanceDueAt: due.toISOString(),
        balanceOverdue: b.status === 'confirmed' && !b.balance_confirmed_at && now.getTime() >= due.getTime(),
      },
    };
  }

  async acceptTerms(bookingId: string, actor: LifecycleActor, termsVersion: string, now = new Date()) {
    const b = await this.bookingRow(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    if (b.user_id !== actor.id) return fail(403, 'FORBIDDEN', 'Chỉ khách đặt đơn đồng ý điều khoản.');
    if (termsVersion !== TERMS_VERSION) return fail(409, 'TERMS_OUTDATED', 'Điều khoản vừa cập nhật, vui lòng tải lại và đọc lại.');
    const live = b.status === 'confirmed' || (b.status === 'pending_deposit' && Date.parse(b.hold_expires_at) > now.getTime());
    if (!live) return fail(409, 'INVALID_STATE', 'Đơn không còn chờ thanh toán.');
    const nowIso = now.toISOString();
    const due = balanceDueAt(b.check_in_date).toISOString();
    await this.d1.batch([
      // Snapshot chụp một lần; gọi lại không ghi đè (cơ sở đổi tài khoản sau đó không ảnh hưởng đơn này).
      this.d1
        .prepare(
          `INSERT OR IGNORE INTO booking_payments (booking_id, terms_version, terms_accepted_at, accepted_by, payee_bank_bin, payee_account_number,
             payee_account_name, total_amount, deposit_amount, balance_amount, deposit_memo, balance_memo, balance_due_at, created_at)
           SELECT b.id, ?, ?, ?, a.bank_bin, a.account_number, a.account_name, b.total_amount, b.deposit_amount, b.total_amount - b.deposit_amount, ?, ?, ?, ?
           FROM bookings b JOIN listing_payout_accounts a ON a.listing_id = b.listing_id WHERE b.id = ?`
        )
        .bind(TERMS_VERSION, nowIso, actor.id, transferMemo(b.booking_code, 'deposit'), transferMemo(b.booking_code, 'balance'), due, nowIso, bookingId),
      this.d1
        .prepare(
          `INSERT INTO booking_events (id, booking_id, action, from_status, to_status, actor_id, actor_role, reason, created_at)
           SELECT ?, ?, 'accept_terms', ?, ?, ?, ?, ?, ? WHERE changes() = 1`
        )
        .bind(rid('ev'), bookingId, b.status, b.status, actor.id, actor.role, TERMS_VERSION, nowIso),
    ]);
    const v = await this.view(bookingId, actor, now);
    if (v.ok && !v.data.termsAccepted) return fail(409, 'PAYOUT_NOT_SET', 'Cơ sở chưa cập nhật tài khoản nhận cọc. Vui lòng liên hệ cơ sở qua số điện thoại trên trang chi tiết.');
    return v;
  }

  // ---------- Biên lai ----------

  async uploadReceipt(bookingId: string, actor: LifecycleActor, kind: string, bytes: Uint8Array, now = new Date()) {
    if (kind !== 'deposit' && kind !== 'balance') return fail(400, 'INVALID_KIND', 'Loại biên lai không hợp lệ.');
    if (!this.storage) return fail(503, 'STORAGE_NOT_CONFIGURED', 'Chưa cấu hình kho lưu biên lai.');
    const b = await this.bookingRow(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    if (b.user_id !== actor.id) return fail(403, 'FORBIDDEN', 'Chỉ khách đặt đơn gửi biên lai.');
    const holdLive = b.status === 'pending_deposit' && Date.parse(b.hold_expires_at) > now.getTime();
    const allowed = kind === 'deposit' ? holdLive || b.status === 'confirmed' : b.status === 'confirmed';
    if (!allowed) {
      return fail(409, 'INVALID_STATE', kind === 'balance' ? 'Gửi biên lai 70% sau khi cơ sở xác nhận đã nhận cọc.' : 'Đơn không còn nhận biên lai cọc.');
    }
    const terms = await this.d1.prepare('SELECT 1 AS ok FROM booking_payments WHERE booking_id = ?').bind(bookingId).first<any>();
    if (!terms) return fail(409, 'TERMS_REQUIRED', 'Vui lòng đồng ý điều khoản trước khi chuyển và gửi biên lai.');
    if (bytes.length > MAX_RECEIPT_BYTES) return fail(413, 'TOO_LARGE', 'Ảnh tối đa 5 MB.');
    const type = detectImageType(bytes);
    if (!type) return fail(415, 'NOT_AN_IMAGE', 'Chỉ nhận ảnh JPG, PNG hoặc WebP.');

    const id = rid('rc');
    const key = `receipts/${bookingId}/${id}`;
    const nowIso = now.toISOString();
    await this.storage.put(key, bytes, type);
    const r = await this.d1
      .prepare(
        `INSERT INTO payment_receipts (id, booking_id, kind, object_key, content_type, size_bytes, uploaded_by, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM payment_receipts WHERE booking_id = ? AND kind = ?) < ?`
      )
      .bind(id, bookingId, kind, key, type, bytes.length, actor.id, nowIso, bookingId, kind, MAX_RECEIPTS_PER_KIND)
      .run();
    if (!Number(r?.meta?.changes ?? 0)) {
      await this.storage.delete(key);
      return fail(409, 'TOO_MANY_RECEIPTS', `Mỗi đơn gửi tối đa ${MAX_RECEIPTS_PER_KIND} ảnh cho mỗi khoản.`);
    }
    await notifyOwnersStmt(this.d1, {
      listingId: b.listing_id,
      kind: 'payment.receipt',
      bookingId,
      title: `Đơn ${b.booking_code}: khách gửi biên lai ${kind === 'deposit' ? 'cọc' : '70%'}`,
      body: 'Kiểm tra tài khoản ngân hàng rồi bấm xác nhận đã nhận. Biên lai chưa phải là xác nhận đã nhận tiền.',
      now: nowIso,
    }).run();
    return { ok: true as const, data: { id, kind, contentType: type, createdAt: nowIso } };
  }

  async getReceipt(bookingId: string, receiptId: string, actor: LifecycleActor) {
    const b = await this.bookingRow(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    if ((await this.lifecycle.partiesOf(b, actor)).length === 0) return fail(403, 'FORBIDDEN', 'Bạn không có quyền xem biên lai này.');
    const r = await this.d1.prepare('SELECT object_key FROM payment_receipts WHERE id = ? AND booking_id = ?').bind(receiptId, bookingId).first<any>();
    if (!r || !this.storage) return fail(404, 'NOT_FOUND', 'Không tìm thấy biên lai.');
    const obj = await this.storage.get(r.object_key);
    if (!obj) return fail(404, 'NOT_FOUND', 'Không tìm thấy biên lai.');
    return { ok: true as const, ...obj };
  }

  // ---------- Xác nhận 70% (thủ công, có log) ----------

  async confirmBalance(bookingId: string, actor: LifecycleActor, now = new Date()) {
    const b = await this.bookingRow(bookingId);
    if (!b) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
    const parties = await this.lifecycle.partiesOf(b, actor);
    if (!parties.includes('owner') && !parties.includes('admin')) return fail(403, 'FORBIDDEN', 'Chỉ chủ cơ sở xác nhận đã nhận tiền.');
    if (b.balance_confirmed_at) return { ok: true as const, already: true };
    if (b.status !== 'confirmed' && b.status !== 'checked_in') return fail(409, 'INVALID_STATE', 'Xác nhận 70% sau khi đã xác nhận nhận cọc.');
    const nowIso = now.toISOString();
    try {
      await this.d1.batch([
        this.d1
          .prepare(`UPDATE bookings SET balance_confirmed_at = ?, balance_confirmed_by = ?, updated_at = ? WHERE id = ? AND status IN ('confirmed', 'checked_in') AND balance_confirmed_at IS NULL`)
          .bind(nowIso, actor.id, nowIso, bookingId),
        ...this.holds.assertion('changes() = 1'),
        bookingEventStmt(this.d1, { bookingId, action: 'confirm_balance', from: b.status, to: b.status, actor: { id: actor.id, role: actor.role }, now: nowIso }),
        notifyUserStmt(this.d1, {
          userId: b.user_id,
          kind: 'payment.balance_confirmed',
          bookingId,
          title: `Đơn ${b.booking_code}: cơ sở đã nhận đủ 70%`,
          body: 'Đơn đã thanh toán đủ. Đưa mã QR trong Chuyến đi của tôi khi nhận phòng.',
          now: nowIso,
        }),
      ]);
    } catch (err: any) {
      if (!/CHECK constraint failed/i.test(String(err?.message))) throw err;
      const fresh = await this.bookingRow(bookingId);
      if (fresh?.balance_confirmed_at) return { ok: true as const, already: true };
      return fail(409, 'INVALID_STATE', 'Đơn vừa thay đổi, vui lòng tải lại.');
    }
    return { ok: true as const, already: false };
  }

  // ---------- Nhắc 70% (cron) ----------

  /** Mốc 48 giờ và 30 giờ trước giờ nhận phòng; mỗi mốc gửi khách một lần (dedupe_key). */
  async sendBalanceReminders(now = new Date()): Promise<number> {
    const nowIso = now.toISOString();
    const checkInUtc = `${String(CHECKIN_HOUR_VN - 7).padStart(2, '0')}:00:00`;
    let sent = 0;
    for (const hours of BALANCE_REMINDER_HOURS) {
      const r = await this.d1
        .prepare(
          `INSERT OR IGNORE INTO notifications (id, user_id, kind, booking_id, title, body, created_at, read_at, dedupe_key)
           SELECT 'nt_' || lower(hex(randomblob(10))), b.user_id, 'payment.balance_reminder', b.id,
                  'Đơn ' || b.booking_code || ': nhắc trả 70% còn lại',
                  'Trả ' || replace(printf('%,d', b.total_amount - b.deposit_amount), ',', '.') || ' đ cho cơ sở trước ' || ? || ' ngày ' || strftime('%d/%m', b.check_in_date, '-1 day')
                    || '. Quá hạn chưa đủ, cơ sở được nhả phòng và cọc không hoàn.',
                  ?, NULL, 'balance:' || b.id || ':' || ?
           FROM bookings b
           WHERE b.status = 'confirmed' AND b.balance_confirmed_at IS NULL
             AND julianday(?) >= julianday(b.check_in_date || ' ' || ?) - ? / 24.0
             AND julianday(?) < julianday(b.check_in_date || ' ' || ?)`
        )
        .bind(`${CHECKIN_HOUR_VN}:00`, nowIso, hours, nowIso, checkInUtc, hours, nowIso, checkInUtc)
        .run();
      sent += Number(r?.meta?.changes ?? 0);
    }
    return sent;
  }
}

