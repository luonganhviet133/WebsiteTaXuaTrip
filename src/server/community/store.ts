/**
 * N06.2 — Sổ Điểm Mây (đóng góp) và sổ phí nền tảng: chỉ ghi thêm; sửa sai bằng dòng bù trỏ về dòng gốc.
 * Xếp hạng/danh hiệu tính từ sổ; đổi quà có cơ chế an toàn nhưng đang khóa (REDEMPTION_ENABLED).
 */
import type { D1Database } from '../d1.ts';
import {
  POINT_RULES, POINTS_WINDOW_DAYS, REDEMPTION_ENABLED, shortName, titleFor, vnMonth,
  PERIOD_RE, periodKind, periodRange, periodLabel, currentPeriod,
} from '../../config/community.ts';
import { HoldStore, notifyUserStmt } from '../bookings/holds.ts';

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });
const rid = (p: string) => `${p}_${Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, '0')).join('')}`;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** [bắt đầu, kết thúc) của tháng giờ VN, dạng ISO UTC để so sánh chuỗi với effective_at. */
export function monthRange(month: string): [string, string] {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - 7 * 3600_000).toISOString();
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1) - 7 * 3600_000).toISOString();
  return [start, end];
}
const windowStart = (now: Date) => new Date(now.getTime() - POINTS_WINDOW_DAYS * 86400_000).toISOString();

export interface Actor {
  id: string;
  role: 'traveler' | 'partner' | 'admin';
  providerId?: string | null;
}

export class CommunityStore {
  private redemptionEnabled: boolean;
  constructor(private d1: D1Database, opts: { redemptionEnabled?: boolean } = {}) {
    this.redemptionEnabled = opts.redemptionEnabled ?? REDEMPTION_ENABLED;
  }

  // ---------- Điểm của tôi ----------

  async me(userId: string, now = new Date()) {
    const since = windowStart(now);
    const [contrib, balance, lifetime, history, month] = await Promise.all([
      this.d1.prepare("SELECT COALESCE(SUM(points), 0) AS s FROM points_ledger WHERE user_id = ? AND source_type <> 'redemption' AND effective_at >= ?").bind(userId, since).first<{ s: number }>(),
      this.d1.prepare('SELECT COALESCE(SUM(points), 0) AS s FROM points_ledger WHERE user_id = ? AND effective_at >= ?').bind(userId, since).first<{ s: number }>(),
      this.d1.prepare("SELECT COALESCE(SUM(points), 0) AS s FROM points_ledger WHERE user_id = ? AND source_type <> 'redemption'").bind(userId).first<{ s: number }>(),
      this.d1
        .prepare('SELECT id, source_type, source_id, points, reason, effective_at, created_at, reverses_id FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 50')
        .bind(userId)
        .all<any>(),
      this.d1
        .prepare("SELECT COALESCE(SUM(points), 0) AS s FROM points_ledger WHERE user_id = ? AND source_type <> 'redemption' AND effective_at >= ? AND effective_at < ?")
        .bind(userId, ...monthRange(vnMonth(now)))
        .first<{ s: number }>(),
    ]);
    const points12m = contrib?.s ?? 0;
    const t = titleFor(points12m);
    return {
      points12m,
      balance: balance?.s ?? 0,
      lifetime: lifetime?.s ?? 0,
      monthPoints: month?.s ?? 0,
      title: t.name,
      next: t.next,
      redemptionEnabled: this.redemptionEnabled,
      history: (history.results || []).map((r: any) => ({
        id: r.id, sourceType: r.source_type, points: r.points, reason: r.reason, effectiveAt: r.effective_at, createdAt: r.created_at,
        expired: r.effective_at < since,
      })),
    };
  }

  // ---------- Bảng xếp hạng ----------

  private async ranking(range: [string, string], limit: number, now: Date) {
    const since = windowStart(now);
    const r = await this.d1
      .prepare(
        `SELECT l.user_id, p.full_name, SUM(l.points) AS pts, MIN(l.effective_at) AS first_at,
                (SELECT COALESCE(SUM(x.points), 0) FROM points_ledger x WHERE x.user_id = l.user_id AND x.source_type <> 'redemption' AND x.effective_at >= ?) AS pts12
         FROM points_ledger l JOIN profiles p ON p.id = l.user_id
         WHERE p.role = 'traveler' AND l.source_type <> 'redemption' AND l.effective_at >= ? AND l.effective_at < ?
         GROUP BY l.user_id HAVING SUM(l.points) > 0
         ORDER BY pts DESC, first_at ASC LIMIT ?`
      )
      .bind(since, range[0], range[1], limit)
      .all<any>();
    return (r.results || []).map((x: any, i: number) => ({
      rank: i + 1, userId: x.user_id, fullName: x.full_name, points: x.pts, title: titleFor(x.pts12).name,
    }));
  }

  async leaderboard(scope: string, period: string | null, now = new Date()) {
    if (!['month', 'quarter', 'year', '12m'].includes(scope)) return fail(400, 'INVALID_SCOPE', 'scope là month, quarter, year hoặc 12m.');
    const p = scope === '12m' ? null : period || currentPeriod(scope as any, now);
    if (p !== null && (!PERIOD_RE.test(p) || periodKind(p) !== scope)) return fail(400, 'INVALID_PERIOD', 'Kỳ dạng YYYY-MM, YYYY-Qn hoặc YYYY, đúng với scope.');
    const range: [string, string] = p ? periodRange(p) : [windowStart(now), new Date(now.getTime() + 1).toISOString()];
    const rows = await this.ranking(range, 20, now);
    return {
      ok: true as const,
      data: { scope, month: p, period: p, items: rows.map((r) => ({ rank: r.rank, name: shortName(r.fullName), points: r.points, title: r.title })) },
    };
  }

  // ---------- Top 3 tháng ----------

  async adminMonthly(month: string, now = new Date()) {
    if (!PERIOD_RE.test(month)) return fail(400, 'INVALID_PERIOD', 'Kỳ dạng YYYY-MM, YYYY-Qn hoặc YYYY.');
    const ranking = await this.ranking(periodRange(month), 10, now);
    const awards = await this.d1
      .prepare('SELECT a.rank, a.user_id, a.points, a.gift_note, a.awarded_at, p.full_name FROM monthly_awards a JOIN profiles p ON p.id = a.user_id WHERE a.month = ? ORDER BY a.rank')
      .bind(month)
      .all<any>();
    return {
      ok: true as const,
      data: {
        month,
        period: month,
        label: periodLabel(month),
        finished: periodRange(month)[1] <= now.toISOString(),
        ranking,
        awards: (awards.results || []).map((a: any) => ({ rank: a.rank, userId: a.user_id, fullName: a.full_name, points: a.points, giftNote: a.gift_note, awardedAt: a.awarded_at })),
      },
    };
  }

  async awardMonthly(month: string, input: any, actor: Actor, now = new Date()) {
    if (!PERIOD_RE.test(month)) return fail(400, 'INVALID_PERIOD', 'Kỳ dạng YYYY-MM, YYYY-Qn hoặc YYYY.');
    if (!(periodRange(month)[1] <= now.toISOString())) return fail(409, 'MONTH_NOT_FINISHED', `Chỉ chốt top 3 khi ${periodLabel(month)} đã kết thúc.`);
    const rank = Number(input?.rank);
    if (![1, 2, 3].includes(rank)) return fail(400, 'INVALID_RANK', 'Hạng là 1, 2 hoặc 3.');
    const giftNote = typeof input?.giftNote === 'string' ? input.giftNote.trim().slice(0, 300) : '';
    if (giftNote.length < 3) return fail(400, 'GIFT_REQUIRED', 'Ghi rõ quà đã trao.');
    const userId = String(input?.userId || '');
    const user = await this.d1.prepare('SELECT id FROM profiles WHERE id = ?').bind(userId).first<any>();
    if (!user) return fail(404, 'USER_NOT_FOUND', 'Không tìm thấy thành viên.');
    const [start, end] = periodRange(month);
    const pts = await this.d1
      .prepare("SELECT COALESCE(SUM(points), 0) AS s FROM points_ledger WHERE user_id = ? AND source_type <> 'redemption' AND effective_at >= ? AND effective_at < ?")
      .bind(userId, start, end)
      .first<{ s: number }>();
    const nowIso = now.toISOString();
    try {
      await this.d1.batch([
        this.d1
          .prepare('INSERT INTO monthly_awards (month, rank, user_id, points, gift_note, awarded_by, awarded_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(month, rank, userId, pts?.s ?? 0, giftNote, actor.id, nowIso),
        notifyUserStmt(this.d1, {
          userId,
          kind: 'community.monthly_award',
          bookingId: null as any,
          title: `Chúc mừng! Bạn đứng hạng ${rank} người đóng góp ${periodLabel(month)}`,
          body: `Tà Xùa Trip gửi tặng: ${giftNote}. Cảm ơn bạn đã đóng góp cho cộng đồng Tà Xùa.`,
          now: nowIso,
        }),
      ]);
    } catch (err: any) {
      if (/UNIQUE constraint failed/i.test(String(err?.message))) return fail(409, 'ALREADY_AWARDED', `Hạng này hoặc thành viên này đã được ghi quà cho ${periodLabel(month)}.`);
      throw err;
    }
    return { ok: true as const, data: { month, rank, userId, points: pts?.s ?? 0, giftNote } };
  }

  async monthlyWinners(month: string) {
    if (!PERIOD_RE.test(month)) return fail(400, 'INVALID_PERIOD', 'Kỳ dạng YYYY-MM, YYYY-Qn hoặc YYYY.');
    const r = await this.d1
      .prepare('SELECT a.rank, a.points, p.full_name FROM monthly_awards a JOIN profiles p ON p.id = a.user_id WHERE a.month = ? ORDER BY a.rank')
      .bind(month)
      .all<any>();
    return { ok: true as const, data: { month, period: month, label: periodLabel(month), winners: (r.results || []).map((x: any) => ({ rank: x.rank, name: shortName(x.full_name), points: x.points })) } };
  }

  // ---------- Admin cộng / thu hồi điểm ----------

  async award(input: any, actor: Actor, now = new Date()) {
    const points = Number(input?.points);
    const reason = typeof input?.reason === 'string' ? input.reason.trim().slice(0, 300) : '';
    const key = String(input?.idempotencyKey || '');
    if (!Number.isInteger(points) || points <= 0 || points > POINT_RULES.admin_award_max) {
      return fail(400, 'INVALID_POINTS', `Điểm cộng là số nguyên 1–${POINT_RULES.admin_award_max}.`);
    }
    if (reason.length < 3) return fail(400, 'REASON_REQUIRED', 'Ghi rõ đóng góp được cộng điểm.');
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) return fail(400, 'INVALID_KEY', 'Thiếu khóa chống bấm lặp.');
    const user = input?.userId
      ? await this.d1.prepare('SELECT id FROM profiles WHERE id = ?').bind(String(input.userId)).first<any>()
      : await this.d1.prepare('SELECT id FROM profiles WHERE lower(email) = lower(?)').bind(String(input?.userEmail || '')).first<any>();
    if (!user) return fail(404, 'USER_NOT_FOUND', 'Không tìm thấy thành viên.');
    const nowIso = now.toISOString();
    await this.d1
      .prepare(
        `INSERT OR IGNORE INTO points_ledger (id, user_id, source_type, source_id, points, reason, created_by, effective_at, created_at)
         VALUES (?, ?, 'admin_award', ?, ?, ?, ?, ?, ?)`
      )
      .bind(rid('pl'), user.id, key, points, reason, actor.id, nowIso, nowIso)
      .run();
    return { ok: true as const, data: { userId: user.id, points } };
  }

  async revoke(entryId: string, input: any, actor: Actor, now = new Date()) {
    const reason = typeof input?.reason === 'string' ? input.reason.trim().slice(0, 300) : '';
    if (reason.length < 3) return fail(400, 'REASON_REQUIRED', 'Ghi rõ lý do thu hồi.');
    const e = await this.d1.prepare('SELECT * FROM points_ledger WHERE id = ?').bind(entryId).first<any>();
    if (!e) return fail(404, 'NOT_FOUND', 'Không tìm thấy dòng điểm.');
    if (e.points <= 0 || e.reverses_id || e.source_type === 'redemption') return fail(409, 'NOT_REVERSIBLE', 'Chỉ thu hồi được dòng cộng điểm.');
    const nowIso = now.toISOString();
    try {
      await this.d1
        .prepare(
          `INSERT INTO points_ledger (id, user_id, source_type, source_id, points, reason, reverses_id, created_by, effective_at, created_at)
           VALUES (?, ?, 'admin_revoke', ?, ?, ?, ?, ?, ?, ?)`
        )
        // Dòng thu hồi lấy mốc của dòng gốc để hạn 12 tháng và xếp hạng tháng tính đúng.
        .bind(rid('pl'), e.user_id, e.id, -e.points, reason, e.id, actor.id, e.effective_at, nowIso)
        .run();
    } catch (err: any) {
      if (/UNIQUE constraint failed/i.test(String(err?.message))) return fail(409, 'ALREADY_REVERSED', 'Dòng này đã được thu hồi.');
      throw err;
    }
    return { ok: true as const, data: { reversed: e.id, points: -e.points } };
  }

  async adminLedger(input: { userEmail?: string | null }) {
    const user = await this.d1.prepare('SELECT id, full_name, email FROM profiles WHERE lower(email) = lower(?)').bind(String(input.userEmail || '')).first<any>();
    if (!user) return fail(404, 'USER_NOT_FOUND', 'Không tìm thấy thành viên.');
    return { ok: true as const, data: { userId: user.id, fullName: user.full_name, email: user.email, ...(await this.me(user.id)) } };
  }

  // ---------- Phí nền tảng ----------

  async listRates() {
    const r = await this.d1
      .prepare(
        `SELECT r.listing_id, r.mode, r.value, r.note, r.updated_at, (SELECT v.content_json FROM listing_versions v WHERE v.listing_id = r.listing_id ORDER BY v.created_at DESC LIMIT 1) AS cj
         FROM listing_fee_rates r ORDER BY r.updated_at DESC`
      )
      .all<any>();
    return {
      ok: true as const,
      data: (r.results || []).map((x: any) => {
        let title = x.listing_id;
        try {
          title = JSON.parse(x.cj || '{}').title || title;
        } catch {
          /* giữ mã cơ sở */
        }
        return { listingId: x.listing_id, title, mode: x.mode, value: x.value, note: x.note, updatedAt: x.updated_at };
      }),
    };
  }

  async setRate(listingId: string, input: any, actor: Actor, now = new Date()) {
    const mode = input?.mode;
    const value = Number(input?.value);
    const valid = (mode === 'fixed' && Number.isInteger(value) && value >= 0 && value <= 10_000_000) || (mode === 'percent_bp' && Number.isInteger(value) && value >= 0 && value <= 5000);
    if (!valid) return fail(400, 'INVALID_RATE', 'Mức phí: số tiền cố định (0–10.000.000 đ) hoặc % (0–50%).');
    const exists = await this.d1.prepare('SELECT id FROM listings WHERE id = ?').bind(listingId).first<any>();
    if (!exists) return fail(404, 'NOT_FOUND', 'Không tìm thấy cơ sở.');
    const note = typeof input?.note === 'string' ? input.note.trim().slice(0, 200) : null;
    const nowIso = now.toISOString();
    await this.d1.batch([
      this.d1
        .prepare(
          `INSERT INTO listing_fee_rates (listing_id, mode, value, note, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(listing_id) DO UPDATE SET mode = excluded.mode, value = excluded.value, note = excluded.note, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
        )
        .bind(listingId, mode, value, note, actor.id, nowIso),
      this.d1
        .prepare('INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(rid('au'), actor.id, actor.role, 'listing.fee_rate', 'listing', listingId, JSON.stringify({ mode, value, note }), nowIso),
    ]);
    return { ok: true as const, data: { listingId, mode, value, note } };
  }

  private async feeEntries(where: string, params: unknown[]) {
    const r = await this.d1
      .prepare(
        `SELECT f.id, f.listing_id, f.booking_id, f.kind, f.amount, f.basis_amount, f.rate_mode, f.rate_value, f.period, f.reason, f.reverses_id, f.created_at,
                b.booking_code, b.listing_title, (SELECT 1 FROM fee_ledger x WHERE x.reverses_id = f.id) AS reversed
         FROM fee_ledger f LEFT JOIN bookings b ON b.id = f.booking_id WHERE ${where} ORDER BY f.created_at, f.rowid`
      )
      .bind(...params)
      .all<any>();
    const entries = (r.results || []).map((x: any) => ({
      id: x.id, listingId: x.listing_id, listingTitle: x.listing_title, bookingId: x.booking_id, bookingCode: x.booking_code, kind: x.kind,
      amount: x.amount, basisAmount: x.basis_amount, rateMode: x.rate_mode, rateValue: x.rate_value, period: x.period, reason: x.reason,
      reversesId: x.reverses_id, reversed: !!x.reversed, createdAt: x.created_at,
    }));
    return { entries, total: entries.reduce((s, e) => s + e.amount, 0) };
  }

  async adminFees(month: string) {
    if (!MONTH_RE.test(month)) return fail(400, 'INVALID_MONTH', 'Tháng dạng YYYY-MM.');
    return { ok: true as const, data: { month, ...(await this.feeEntries('f.period = ?', [month])) } };
  }

  async partnerFees(actor: Actor, month: string) {
    if (!MONTH_RE.test(month)) return fail(400, 'INVALID_MONTH', 'Tháng dạng YYYY-MM.');
    return {
      ok: true as const,
      data: {
        month,
        ...(await this.feeEntries('f.period = ? AND f.listing_id IN (SELECT listing_id FROM provider_listings WHERE provider_id = ?)', [month, actor.providerId ?? ''])),
      },
    };
  }

  async reverseFee(entryId: string, input: any, actor: Actor, now = new Date()) {
    const reason = typeof input?.reason === 'string' ? input.reason.trim().slice(0, 300) : '';
    if (reason.length < 3) return fail(400, 'REASON_REQUIRED', 'Ghi rõ lý do đảo phí.');
    const e = await this.d1.prepare('SELECT * FROM fee_ledger WHERE id = ?').bind(entryId).first<any>();
    if (!e) return fail(404, 'NOT_FOUND', 'Không tìm thấy dòng phí.');
    if (e.kind !== 'platform_fee') return fail(409, 'NOT_REVERSIBLE', 'Chỉ đảo được dòng phí gốc.');
    try {
      await this.d1
        .prepare(
          `INSERT INTO fee_ledger (id, listing_id, booking_id, kind, amount, basis_amount, rate_mode, rate_value, period, reason, reverses_id, created_by, created_at)
           VALUES (?, ?, ?, 'reversal', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(rid('fe'), e.listing_id, e.booking_id, -e.amount, e.basis_amount, e.rate_mode, e.rate_value, e.period, reason, e.id, actor.id, now.toISOString())
        .run();
    } catch (err: any) {
      if (/UNIQUE constraint failed/i.test(String(err?.message))) return fail(409, 'ALREADY_REVERSED', 'Dòng phí này đã được đảo.');
      throw err;
    }
    return { ok: true as const, data: { reversed: e.id, amount: -e.amount } };
  }

  // ---------- Đổi điểm lấy quà (đang khóa) ----------

  async redeem(userId: string, rewardId: string, idempotencyKey: string, now = new Date()) {
    if (!this.redemptionEnabled) return fail(403, 'REDEMPTION_DISABLED', 'Đổi Điểm Mây lấy quà sẽ mở khi Tà Xùa Trip chốt giá trị điểm.');
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(idempotencyKey)) return fail(400, 'INVALID_KEY', 'Thiếu khóa chống bấm lặp.');
    const prior = await this.d1.prepare('SELECT gift_code, points FROM point_redemptions WHERE user_id = ? AND idempotency_key = ?').bind(userId, idempotencyKey).first<any>();
    if (prior) return { ok: true as const, giftCode: prior.gift_code as string, idempotencyKey, replay: true };
    const reward = await this.d1.prepare('SELECT id, points_cost FROM point_rewards WHERE id = ? AND active = 1').bind(rewardId).first<any>();
    if (!reward) return fail(404, 'REWARD_NOT_FOUND', 'Quà không tồn tại hoặc đã ngừng.');
    const nowIso = now.toISOString();
    const id = rid('rd');
    const giftCode = `MAY-${Array.from(crypto.getRandomValues(new Uint8Array(5)), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('')}`;
    try {
      await this.d1.batch([
        // Chỉ ghi khi số dư 12 tháng đủ (điều kiện trong cùng câu lệnh) → không âm khi bấm đồng thời.
        this.d1
          .prepare(
            `INSERT INTO point_redemptions (id, user_id, reward_id, points, gift_code, idempotency_key, created_at)
             SELECT ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COALESCE(SUM(points), 0) FROM points_ledger WHERE user_id = ? AND effective_at >= ?) >= ?`
          )
          .bind(id, userId, rewardId, reward.points_cost, giftCode, idempotencyKey, nowIso, userId, windowStart(now), reward.points_cost),
        this.d1
          .prepare(
            `INSERT INTO points_ledger (id, user_id, source_type, source_id, points, reason, created_by, effective_at, created_at)
             SELECT ?, ?, 'redemption', ?, ?, 'Đổi quà', ?, ?, ? WHERE changes() = 1`
          )
          .bind(rid('pl'), userId, id, -reward.points_cost, userId, nowIso, nowIso),
        ...new HoldStore(this.d1).assertion('(SELECT COUNT(*) FROM point_redemptions WHERE id = ?) = 1', id),
      ]);
    } catch (err: any) {
      const msg = String(err?.message);
      if (/UNIQUE constraint failed/i.test(msg)) {
        const again = await this.d1.prepare('SELECT gift_code FROM point_redemptions WHERE user_id = ? AND idempotency_key = ?').bind(userId, idempotencyKey).first<any>();
        if (again) return { ok: true as const, giftCode: again.gift_code as string, idempotencyKey, replay: true };
      }
      if (/CHECK constraint failed/i.test(msg)) return fail(409, 'NOT_ENOUGH_POINTS', 'Chưa đủ Điểm Mây để đổi quà này.');
      throw err;
    }
    return { ok: true as const, giftCode, idempotencyKey, replay: false };
  }
}
