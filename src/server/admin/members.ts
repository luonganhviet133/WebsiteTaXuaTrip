/**
 * R2 — Quản trị thành viên và đối tác.
 * - Mọi thay đổi (khóa/mở, đổi vai trò, cấp mã đặt lại, xác minh đối tác) ghi audit_log trong CÙNG batch với thay đổi.
 * - Không tự khóa/đổi vai trò/cấp mã cho chính mình; luôn còn ít nhất một admin đang hoạt động
 *   (kiểm bằng batch_assertions sau khi ghi → hai admin thao tác cùng lúc cũng không làm mất admin cuối).
 * - Mã đặt lại do admin cấp: 6 số, hiện cho admin MỘT lần để đọc cho khách qua điện thoại, chỉ lưu băm, hạn 60 phút.
 */
import crypto from 'node:crypto';
import type { D1Database } from '../d1.ts';
import { HoldStore } from '../bookings/holds.ts';
import { CODE_POLICY } from '../accounts/rules.ts';

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });
const rid = (p: string) => `${p}_${crypto.randomBytes(10).toString('hex')}`;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const ROLES = ['traveler', 'partner', 'admin'] as const;
export const MEMBER_STATUSES = ['active', 'locked'] as const;
export const PARTNER_VERIFICATIONS = ['pending', 'verified', 'rejected'] as const;
export const ADMIN_RESET_CODE_MINUTES = 60;
const ADMIN_RESET_CODES_PER_HOUR = 5;
type Role = (typeof ROLES)[number];

const ACTIVE_ADMIN_EXISTS = "(SELECT COUNT(*) FROM profiles WHERE role = 'admin' AND status = 'active') >= 1";

function reasonOf(raw: unknown, min = 3): string | null {
  const r = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  return r.length >= min && r.length <= 300 ? r : null;
}
const REASON_FAIL = fail(400, 'REASON_REQUIRED', 'Vui lòng ghi lý do (3–300 ký tự) để lưu vào nhật ký.');

const LIST_COLUMNS = `p.id, p.email, p.phone, p.full_name, p.role, p.status, p.status_reason, p.email_verified_at, p.failed_login_count,
  p.login_locked_until, p.last_login_at, p.created_at, pr.business_name, pr.verification_status`;

function toMember(r: any, now: Date) {
  const placeholder = String(r.email).endsWith('@taxuatrip.user');
  return {
    id: r.id,
    email: placeholder ? null : r.email,
    phone: r.phone || '',
    fullName: r.full_name,
    role: r.role as Role,
    status: r.status as 'active' | 'locked',
    statusReason: r.status_reason ?? null,
    emailVerified: !!r.email_verified_at,
    loginLocked: !!r.login_locked_until && Date.parse(r.login_locked_until) > now.getTime(),
    lastLoginAt: r.last_login_at ?? null,
    createdAt: r.created_at,
    businessName: r.business_name ?? null,
    partnerVerification: r.verification_status ?? null,
  };
}

export class MemberAdminStore {
  private holds: HoldStore;
  constructor(private d1: D1Database) {
    this.holds = new HoldStore(d1);
  }

  private audit(actorId: string, action: string, entityId: string, detail: Record<string, unknown>, nowIso: string, entityType = 'profile') {
    return this.d1
      .prepare('INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(rid('au'), actorId, 'admin', action, entityType, entityId, JSON.stringify(detail), nowIso);
  }

  /** Chạy batch có kiểm "còn admin hoạt động"; vi phạm thì cả batch hủy. */
  private async guarded(stmts: any[]): Promise<Fail | null> {
    try {
      await this.d1.batch([...stmts, ...this.holds.assertion(ACTIVE_ADMIN_EXISTS)]);
      return null;
    } catch (err: any) {
      if (/CHECK constraint failed/i.test(String(err?.message))) return fail(409, 'LAST_ADMIN', 'Phải còn ít nhất một quản trị viên đang hoạt động.');
      throw err;
    }
  }

  private async target(id: string, actorId: string) {
    if (id === actorId) return fail(400, 'SELF_ACTION', 'Không tự thao tác trên tài khoản của chính mình. Nhờ quản trị viên khác.');
    const r = await this.d1.prepare(`SELECT ${LIST_COLUMNS} FROM profiles p LEFT JOIN providers pr ON pr.user_id = p.id WHERE p.id = ?`).bind(id).first<any>();
    return r ? { ok: true as const, row: r } : fail(404, 'NOT_FOUND', 'Không tìm thấy thành viên.');
  }

  private async view(id: string, now: Date, already = false) {
    const r = await this.d1.prepare(`SELECT ${LIST_COLUMNS} FROM profiles p LEFT JOIN providers pr ON pr.user_id = p.id WHERE p.id = ?`).bind(id).first<any>();
    return { ok: true as const, already, data: toMember(r, now) };
  }

  // ---------- Xem ----------

  async list(query: URLSearchParams, now = new Date()) {
    const role = query.get('role') || '';
    const status = query.get('status') || '';
    const verification = query.get('verification') || '';
    if (role && !(ROLES as readonly string[]).includes(role)) return fail(400, 'INVALID_FILTER', 'Vai trò không hợp lệ.');
    if (status && !(MEMBER_STATUSES as readonly string[]).includes(status)) return fail(400, 'INVALID_FILTER', 'Trạng thái không hợp lệ.');
    if (verification && !(PARTNER_VERIFICATIONS as readonly string[]).includes(verification)) return fail(400, 'INVALID_FILTER', 'Trạng thái xác minh không hợp lệ.');
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.get('pageSize') || '25', 10) || 25));
    const page = Math.max(1, Number.parseInt(query.get('page') || '1', 10) || 1);

    const where: string[] = [];
    const params: unknown[] = [];
    const q = (query.get('q') || '').trim().toLowerCase().slice(0, 80);
    if (q) {
      const digits = q.replace(/[\s.+-]/g, '').replace(/^84(?=\d{9}$)/, '0');
      where.push("(LOWER(p.full_name) LIKE ? OR LOWER(p.email) LIKE ? OR REPLACE(p.phone, ' ', '') LIKE ? OR LOWER(COALESCE(pr.business_name, '')) LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${digits || q}%`, `%${q}%`);
    }
    if (role) { where.push('p.role = ?'); params.push(role); }
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (verification) { where.push('pr.verification_status = ?'); params.push(verification); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = 'FROM profiles p LEFT JOIN providers pr ON pr.user_id = p.id';
    const total = await this.d1.prepare(`SELECT COUNT(*) AS n ${from} ${w}`).bind(...params).first<any>();
    const rows = await this.d1
      .prepare(`SELECT ${LIST_COLUMNS} ${from} ${w} ORDER BY p.created_at DESC, p.id LIMIT ? OFFSET ?`)
      .bind(...params, pageSize, (page - 1) * pageSize)
      .all<any>();
    return { ok: true as const, data: { items: (rows.results || []).map((r: any) => toMember(r, now)), total: Number(total?.n ?? 0), page, pageSize } };
  }

  async detail(id: string, now = new Date()) {
    const r = await this.d1.prepare(`SELECT ${LIST_COLUMNS} FROM profiles p LEFT JOIN providers pr ON pr.user_id = p.id WHERE p.id = ?`).bind(id).first<any>();
    if (!r) return fail(404, 'NOT_FOUND', 'Không tìm thấy thành viên.');
    const nowIso = now.toISOString();
    const [sessions, bookings, listings, history] = await Promise.all([
      this.d1.prepare('SELECT COUNT(*) AS n FROM user_sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?').bind(id, nowIso).first<any>(),
      this.d1.prepare('SELECT COUNT(*) AS n FROM bookings WHERE user_id = ?').bind(id).first<any>(),
      this.d1.prepare('SELECT COUNT(*) AS n FROM provider_listings pl JOIN providers pr ON pr.id = pl.provider_id WHERE pr.user_id = ?').bind(id).first<any>(),
      this.d1
        .prepare(
          `SELECT a.action, a.detail_json, a.created_at, a.actor_id, ap.full_name AS actor_name FROM audit_log a
           LEFT JOIN profiles ap ON ap.id = a.actor_id
           WHERE a.entity_type = 'profile' AND a.entity_id = ? AND (a.action LIKE 'member.%' OR a.action LIKE 'partner.%')
           ORDER BY a.created_at DESC, a.rowid DESC LIMIT 30`
        )
        .bind(id)
        .all<any>(),
    ]);
    return {
      ok: true as const,
      data: {
        ...toMember(r, now),
        activeSessions: Number(sessions?.n ?? 0),
        bookings: Number(bookings?.n ?? 0),
        ownedListings: Number(listings?.n ?? 0),
        history: (history.results || []).map((h: any) => {
          const detail = (() => { try { return JSON.parse(h.detail_json || '{}'); } catch { return {}; } })();
          return { action: h.action, at: h.created_at, actorName: h.actor_name ?? 'Hệ thống', reason: detail.reason ?? detail.note ?? null, detail };
        }),
      },
    };
  }

  async overview(now = new Date()) {
    const since = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const [roles, locked, pending, newMembers, bookings, listings, complaints] = await Promise.all([
      this.d1.prepare('SELECT role, COUNT(*) AS n FROM profiles GROUP BY role').all<any>(),
      this.d1.prepare("SELECT COUNT(*) AS n FROM profiles WHERE status = 'locked'").first<any>(),
      this.d1.prepare("SELECT COUNT(*) AS n FROM providers pr JOIN profiles p ON p.id = pr.user_id WHERE p.role = 'partner' AND pr.verification_status = 'pending'").first<any>(),
      this.d1.prepare('SELECT COUNT(*) AS n FROM profiles WHERE created_at >= ?').bind(since).first<any>(),
      this.d1.prepare('SELECT COUNT(*) AS n FROM bookings').first<any>(),
      this.d1.prepare('SELECT COUNT(*) AS n FROM listings').first<any>(),
      this.d1.prepare("SELECT COUNT(*) AS n FROM complaints WHERE status <> 'closed'").first<any>(),
    ]);
    const members = { traveler: 0, partner: 0, admin: 0, locked: Number(locked?.n ?? 0) };
    for (const r of roles.results || []) if (r.role in members) (members as any)[r.role] = Number(r.n);
    return {
      ok: true as const,
      data: {
        members,
        partnersPending: Number(pending?.n ?? 0),
        newMembers7d: Number(newMembers?.n ?? 0),
        totalBookings: Number(bookings?.n ?? 0),
        listings: Number(listings?.n ?? 0),
        openComplaints: Number(complaints?.n ?? 0),
        serverTimestamp: now.toISOString(),
      },
    };
  }

  // ---------- Thao tác ----------

  async lock(id: string, actorId: string, rawReason: unknown, now = new Date()) {
    const reason = reasonOf(rawReason);
    if (!reason) return REASON_FAIL;
    const t = await this.target(id, actorId);
    if (!t.ok) return t;
    if (t.row.status === 'locked') return this.view(id, now, true);
    const nowIso = now.toISOString();
    const err = await this.guarded([
      this.d1.prepare("UPDATE profiles SET status = 'locked', status_reason = ?, status_changed_at = ?, status_changed_by = ?, updated_at = ? WHERE id = ? AND status = 'active'").bind(reason, nowIso, actorId, nowIso, id),
      ...this.holds.assertion('changes() = 1'),
      this.d1.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(nowIso, id),
      this.audit(actorId, 'member.lock', id, { reason }, nowIso),
    ]);
    if (err) {
      // CHECK lỗi có thể do bấm lặp đồng thời (đã khóa) chứ không phải admin cuối.
      const cur = await this.d1.prepare('SELECT status FROM profiles WHERE id = ?').bind(id).first<any>();
      if (cur?.status === 'locked') return this.view(id, now, true);
      return err;
    }
    return this.view(id, now);
  }

  async unlock(id: string, actorId: string, rawReason: unknown, now = new Date()) {
    const reason = reasonOf(rawReason);
    if (!reason) return REASON_FAIL;
    const t = await this.target(id, actorId);
    if (!t.ok) return t;
    const loginLocked = !!t.row.login_locked_until || Number(t.row.failed_login_count) > 0;
    if (t.row.status === 'active' && !loginLocked) return this.view(id, now, true);
    const nowIso = now.toISOString();
    await this.d1.batch([
      this.d1
        .prepare("UPDATE profiles SET status = 'active', status_reason = NULL, status_changed_at = ?, status_changed_by = ?, failed_login_count = 0, login_locked_until = NULL, updated_at = ? WHERE id = ?")
        .bind(nowIso, actorId, nowIso, id),
      this.audit(actorId, 'member.unlock', id, { reason, wasLocked: t.row.status === 'locked', clearedLoginLock: loginLocked }, nowIso),
    ]);
    return this.view(id, now);
  }

  async setRole(id: string, actorId: string, rawRole: unknown, rawReason: unknown, now = new Date()) {
    const role = String(rawRole || '') as Role;
    if (!(ROLES as readonly string[]).includes(role)) return fail(400, 'INVALID_ROLE', 'Vai trò không hợp lệ.');
    const reason = reasonOf(rawReason);
    if (!reason) return REASON_FAIL;
    const t = await this.target(id, actorId);
    if (!t.ok) return t;
    if (t.row.role === role) return this.view(id, now, true);
    const nowIso = now.toISOString();
    const stmts: any[] = [
      this.d1.prepare('UPDATE profiles SET role = ?, updated_at = ? WHERE id = ? AND role = ?').bind(role, nowIso, id, t.row.role),
      ...this.holds.assertion('changes() = 1'),
      // Đăng nhập lại để giao diện và quyền khớp vai trò mới.
      this.d1.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(nowIso, id),
      this.audit(actorId, 'member.role', id, { reason, from: t.row.role, to: role }, nowIso),
    ];
    if (role === 'partner') {
      // Chưa có hồ sơ đối tác thì tạo, chờ admin xác minh.
      stmts.push(
        this.d1
          .prepare(
            `INSERT INTO providers (id, user_id, business_name, phone, tax_or_cccd, verification_status, created_at, updated_at)
             SELECT ?, ?, ?, ?, '', 'pending', ?, ? WHERE NOT EXISTS (SELECT 1 FROM providers WHERE user_id = ?)`
          )
          .bind(rid('prov'), id, t.row.full_name, t.row.phone || '', nowIso, nowIso, id)
      );
    }
    const err = await this.guarded(stmts);
    if (err) {
      const cur = await this.d1.prepare('SELECT role FROM profiles WHERE id = ?').bind(id).first<any>();
      if (cur?.role === role) return this.view(id, now, true);
      return err;
    }
    return this.view(id, now);
  }

  async setPartnerVerification(id: string, actorId: string, rawStatus: unknown, rawNote: unknown, now = new Date()) {
    const status = String(rawStatus || '');
    if (!(PARTNER_VERIFICATIONS as readonly string[]).includes(status)) return fail(400, 'INVALID_STATUS', 'Trạng thái xác minh không hợp lệ.');
    const note = reasonOf(rawNote, 2);
    if (!note) return fail(400, 'REASON_REQUIRED', 'Ghi chú cách đã xác minh (ví dụ: đã gọi số…, xác nhận chủ cơ sở).');
    const t = await this.target(id, actorId);
    if (!t.ok) return t;
    if (t.row.role !== 'partner' || !t.row.verification_status) return fail(400, 'NOT_PARTNER', 'Tài khoản này không phải đối tác.');
    if (t.row.verification_status === status) return this.view(id, now, true);
    const nowIso = now.toISOString();
    await this.d1.batch([
      this.d1
        .prepare(
          `UPDATE providers SET verification_status = ?, verified_at = CASE WHEN ? = 'verified' THEN ? ELSE NULL END,
             verified_by = CASE WHEN ? = 'verified' THEN ? ELSE NULL END, updated_at = ? WHERE user_id = ?`
        )
        .bind(status, status, nowIso, status, actorId, nowIso, id),
      this.audit(actorId, 'partner.verify', id, { status, from: t.row.verification_status, note }, nowIso),
    ]);
    return this.view(id, now);
  }

  /** Mã 6 số hiện cho admin một lần; khách dùng ở "Đặt lại mật khẩu" bằng email hoặc SĐT. */
  async issueResetCode(id: string, actorId: string, rawReason: unknown, now = new Date()) {
    const reason = reasonOf(rawReason);
    if (!reason) return REASON_FAIL;
    const t = await this.target(id, actorId);
    if (!t.ok) return t;
    if (t.row.status !== 'active') return fail(409, 'ACCOUNT_LOCKED', 'Tài khoản đang bị khóa. Mở khóa trước khi cấp mã.');
    const nowIso = now.toISOString();
    const recent = await this.d1
      .prepare("SELECT COUNT(*) AS n FROM auth_codes WHERE user_id = ? AND purpose = 'reset_password' AND sent_to = 'admin' AND created_at >= ?")
      .bind(id, new Date(now.getTime() - 3600_000).toISOString())
      .first<any>();
    if (Number(recent?.n ?? 0) >= ADMIN_RESET_CODES_PER_HOUR) return fail(429, 'TOO_MANY_CODES', 'Đã cấp quá nhiều mã cho tài khoản này trong 1 giờ.');
    const codeId = rid('ac');
    const code = String(crypto.randomInt(0, 10 ** CODE_POLICY.digits)).padStart(CODE_POLICY.digits, '0');
    const expiresAt = new Date(now.getTime() + ADMIN_RESET_CODE_MINUTES * 60_000).toISOString();
    await this.d1.batch([
      this.d1.prepare("UPDATE auth_codes SET used_at = ? WHERE user_id = ? AND purpose = 'reset_password' AND used_at IS NULL").bind(nowIso, id),
      this.d1
        .prepare("INSERT INTO auth_codes (id, user_id, purpose, code_hash, sent_to, attempts, expires_at, created_at) VALUES (?, ?, 'reset_password', ?, 'admin', 0, ?, ?)")
        .bind(codeId, id, sha(`${codeId}:${code}`), expiresAt, nowIso),
      this.audit(actorId, 'member.reset_code', id, { reason, expiresAt }, nowIso),
    ]);
    const m = toMember(t.row, now);
    return { ok: true as const, data: { code, expiresAt, loginWith: m.email ?? m.phone } };
  }
}
