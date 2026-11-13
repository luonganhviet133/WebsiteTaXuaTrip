/**
 * R1 — Tài khoản: hồ sơ cá nhân, phiên đăng nhập, mã email (xác minh email, đặt lại mật khẩu).
 * Mã 6 số chỉ lưu băm, dùng một lần; sai quá số lần thì mã hết hiệu lực.
 * Chưa bật dịch vụ email (gói Free) thì các tính năng gửi mã báo EMAIL_NOT_CONFIGURED, không giả là đã gửi.
 */
import crypto from 'node:crypto';
import type { D1Database } from '../d1.ts';
import { hashPassword, hashToken } from '../db.ts';
import type { EmailSender } from '../email.ts';
import { codeEmail } from '../email.ts';
import { HoldStore } from '../bookings/holds.ts';
import { CODE_POLICY, TERMS_VERSION, PASSWORD_MIN, checkPassword, deviceLabel, maskEmail, normalizeEmail, normalizeVnPhone } from './rules.ts';

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });
const rid = (p: string) => `${p}_${crypto.randomBytes(10).toString('hex')}`;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const hashSessionToken = hashToken;
const codeHash = (codeId: string, code: string) => sha(`${codeId}:${code}`);
type Purpose = 'verify_email' | 'reset_password';

export class AccountStore {
  private holds: HoldStore;
  constructor(private d1: D1Database, private email: EmailSender) {
    this.holds = new HoldStore(d1);
  }

  config() {
    return { emailEnabled: this.email.available, passwordMin: PASSWORD_MIN, termsVersion: TERMS_VERSION };
  }

  // ---------- Hồ sơ ----------

  async profile(userId: string) {
    const p = await this.d1
      .prepare(
        `SELECT p.id, p.email, p.phone, p.full_name, p.role, p.email_verified_at, p.terms_version, p.terms_accepted_at, p.created_at,
                pr.business_name, pr.verification_status
         FROM profiles p LEFT JOIN providers pr ON pr.user_id = p.id WHERE p.id = ?`
      )
      .bind(userId)
      .first<any>();
    if (!p) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.');
    const placeholder = p.email.endsWith('@taxuatrip.user');
    return {
      ok: true as const,
      data: {
        id: p.id,
        email: placeholder ? null : p.email,
        phone: p.phone || '',
        fullName: p.full_name,
        role: p.role,
        emailVerified: !!p.email_verified_at,
        termsAccepted: p.terms_version === TERMS_VERSION,
        businessName: p.business_name ?? null,
        partnerVerification: p.verification_status ?? null,
        createdAt: p.created_at,
        emailEnabled: this.email.available,
      },
    };
  }

  async updateProfile(userId: string, input: any, now = new Date()) {
    const current = await this.d1.prepare('SELECT role FROM profiles WHERE id = ?').bind(userId).first<any>();
    if (!current) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.');
    const fullName = typeof input?.fullName === 'string' ? input.fullName.trim().replace(/\s+/g, ' ') : '';
    if (fullName.length < 2 || fullName.length > 80) return fail(400, 'INVALID_NAME', 'Họ tên từ 2 đến 80 ký tự.');
    let phone = '';
    if (input?.phone) {
      const p = normalizeVnPhone(input.phone);
      if (!p) return fail(400, 'INVALID_PHONE', 'Số điện thoại Việt Nam gồm 10 số, ví dụ 0912345678.');
      const taken = await this.d1.prepare("SELECT 1 AS x FROM profiles WHERE REPLACE(phone, ' ', '') = ? AND id <> ?").bind(p, userId).first<any>();
      if (taken) return fail(409, 'PHONE_EXISTS', 'Số điện thoại này đã gắn với tài khoản khác.');
      phone = p;
    }
    if (current.role === 'partner' && !phone) return fail(400, 'PHONE_REQUIRED', 'Đối tác cần số điện thoại để Tà Xùa Trip liên hệ xác minh.');
    const nowIso = now.toISOString();
    const stmts = [this.d1.prepare('UPDATE profiles SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?').bind(fullName, phone, nowIso, userId)];
    if (current.role === 'partner' && typeof input?.businessName === 'string') {
      const bn = input.businessName.trim().replace(/\s+/g, ' ');
      if (bn.length < 2 || bn.length > 120) return fail(400, 'INVALID_BUSINESS', 'Tên cơ sở/doanh nghiệp từ 2 đến 120 ký tự.');
      stmts.push(this.d1.prepare('UPDATE providers SET business_name = ?, phone = ?, updated_at = ? WHERE user_id = ?').bind(bn, phone, nowIso, userId));
    }
    await this.d1.batch(stmts);
    return this.profile(userId);
  }

  // ---------- Phiên ----------

  async sessions(userId: string, currentToken: string, now = new Date()) {
    const cur = hashSessionToken(currentToken);
    const r = await this.d1
      .prepare(
        `SELECT id, token_hash, user_agent, created_at, last_seen_at, expires_at FROM user_sessions
         WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY COALESCE(last_seen_at, created_at) DESC LIMIT 50`
      )
      .bind(userId, now.toISOString())
      .all<any>();
    return {
      ok: true as const,
      data: (r.results || []).map((s: any) => ({
        id: s.id, device: deviceLabel(s.user_agent), createdAt: s.created_at, lastSeenAt: s.last_seen_at ?? s.created_at, expiresAt: s.expires_at,
        current: s.token_hash === cur,
      })),
    };
  }

  async revokeSession(userId: string, sessionId: string, now = new Date()) {
    const r = await this.d1
      .prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL')
      .bind(now.toISOString(), sessionId, userId)
      .run();
    if (!Number(r?.meta?.changes ?? 0)) return fail(404, 'NOT_FOUND', 'Không tìm thấy phiên đăng nhập.');
    return { ok: true as const, data: { revoked: 1 } };
  }

  async revokeOtherSessions(userId: string, currentToken: string, now = new Date()) {
    const r = await this.d1
      .prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL AND token_hash <> ?')
      .bind(now.toISOString(), userId, hashSessionToken(currentToken))
      .run();
    return { ok: true as const, data: { revoked: Number(r?.meta?.changes ?? 0) } };
  }

  // ---------- Mã qua email ----------

  /** Tạo và gửi mã. Trả `throttled` khi gửi quá dày (gọi từ quên mật khẩu thì không báo ra ngoài). */
  private async issueCode(user: { id: string; email: string; full_name: string }, purpose: Purpose, now: Date) {
    const nowMs = now.getTime();
    const recent = await this.d1
      .prepare('SELECT created_at FROM auth_codes WHERE user_id = ? AND purpose = ? AND created_at >= ? ORDER BY created_at DESC')
      .bind(user.id, purpose, new Date(nowMs - 3600_000).toISOString())
      .all<any>();
    const list = recent.results || [];
    if (list.length >= CODE_POLICY.maxPerHour) return { sent: false as const, throttled: 'hour' as const };
    if (list[0] && nowMs - Date.parse(list[0].created_at) < CODE_POLICY.resendSeconds * 1000) return { sent: false as const, throttled: 'cooldown' as const };

    const id = rid('ac');
    const code = String(crypto.randomInt(0, 10 ** CODE_POLICY.digits)).padStart(CODE_POLICY.digits, '0');
    const nowIso = now.toISOString();
    // Mã mới thay mã cũ cùng mục đích: mã cũ hết hiệu lực.
    await this.d1.batch([
      this.d1.prepare('UPDATE auth_codes SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL').bind(nowIso, user.id, purpose),
      this.d1
        .prepare('INSERT INTO auth_codes (id, user_id, purpose, code_hash, sent_to, attempts, expires_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)')
        .bind(id, user.id, purpose, codeHash(id, code), user.email, new Date(nowMs + CODE_POLICY.ttlMinutes * 60_000).toISOString(), nowIso),
    ]);
    const mail = codeEmail(purpose, user.full_name, code, CODE_POLICY.ttlMinutes);
    try {
      const r = await this.email.send({ to: user.email, ...mail });
      await this.logEmail(user.id, user.email, purpose, 'sent', r.messageId, null, nowIso);
      return { sent: true as const };
    } catch (err: any) {
      await this.d1.prepare('UPDATE auth_codes SET used_at = ? WHERE id = ?').bind(nowIso, id).run();
      await this.logEmail(user.id, user.email, purpose, 'failed', null, String(err?.code || err?.message || 'error').slice(0, 200), nowIso);
      return { sent: false as const, error: true as const };
    }
  }

  private logEmail(userId: string, to: string, template: string, status: string, messageId: string | null, error: string | null, now: string) {
    return this.d1
      .prepare('INSERT INTO email_log (id, user_id, to_email, template, status, provider_message_id, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(rid('em'), userId, to, template, status, messageId, error, now)
      .run();
  }

  /** Kiểm mã: đúng thì đánh dấu đã dùng (một lần), sai thì tăng số lần nhập. */
  private async consumeCode(userId: string, purpose: Purpose, code: string, now: Date, extra: any[] = []) {
    const nowIso = now.toISOString();
    const c = await this.d1
      .prepare('SELECT id, code_hash, attempts FROM auth_codes WHERE user_id = ? AND purpose = ? AND used_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1')
      .bind(userId, purpose, nowIso)
      .first<any>();
    const bad = fail(400, 'INVALID_CODE', 'Mã không đúng hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
    if (!c || c.attempts >= CODE_POLICY.maxAttempts || !/^\d{6}$/.test(code)) return bad;
    const a = Buffer.from(codeHash(c.id, code));
    const b = Buffer.from(c.code_hash);
    if (!crypto.timingSafeEqual(a, b)) {
      await this.d1
        .prepare('UPDATE auth_codes SET attempts = attempts + 1, used_at = CASE WHEN attempts + 1 >= ? THEN ? ELSE used_at END WHERE id = ?')
        .bind(CODE_POLICY.maxAttempts, nowIso, c.id)
        .run();
      return bad;
    }
    try {
      await this.d1.batch([
        this.d1.prepare('UPDATE auth_codes SET used_at = ? WHERE id = ? AND used_at IS NULL').bind(nowIso, c.id),
        ...this.holds.assertion('changes() = 1'),
        ...extra,
      ]);
    } catch (err: any) {
      if (/CHECK constraint failed/i.test(String(err?.message))) return bad; // hai yêu cầu dùng cùng mã: chỉ một cái thành công
      throw err;
    }
    return { ok: true as const };
  }

  async requestEmailVerification(userId: string, now = new Date()) {
    if (!this.email.available) return fail(503, 'EMAIL_NOT_CONFIGURED', 'Gửi email xác minh sẽ hoạt động sau khi Tà Xùa Trip bật dịch vụ email.');
    const u = await this.d1.prepare('SELECT id, email, full_name, email_verified_at FROM profiles WHERE id = ?').bind(userId).first<any>();
    if (!u) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.');
    if (u.email.endsWith('@taxuatrip.user')) return fail(400, 'NO_EMAIL', 'Tài khoản chưa có email. Liên hệ Tà Xùa Trip để thêm email.');
    if (u.email_verified_at) return { ok: true as const, already: true, data: { sentTo: maskEmail(u.email) } };
    const r = await this.issueCode(u, 'verify_email', now);
    if (r.sent) return { ok: true as const, data: { sentTo: maskEmail(u.email) } };
    if ('throttled' in r) return fail(429, 'TOO_SOON', r.throttled === 'cooldown' ? 'Vui lòng đợi 60 giây rồi gửi lại.' : 'Bạn đã yêu cầu quá nhiều mã trong 1 giờ.');
    return fail(502, 'EMAIL_FAILED', 'Chưa gửi được email, vui lòng thử lại sau.');
  }

  async verifyEmail(userId: string, code: string, now = new Date()) {
    const nowIso = now.toISOString();
    const r = await this.consumeCode(userId, 'verify_email', String(code || '').trim(), now, [
      this.d1.prepare('UPDATE profiles SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?').bind(nowIso, nowIso, userId),
    ]);
    if (!r.ok) return r;
    return { ok: true as const, data: { emailVerified: true } };
  }

  /** Luôn trả cùng một câu (không lộ email nào đã đăng ký); chỉ báo khi dịch vụ email chưa bật. */
  async forgotPassword(rawEmail: unknown, now = new Date()) {
    if (!this.email.available) {
      return fail(503, 'EMAIL_NOT_CONFIGURED', 'Đặt lại mật khẩu qua email sẽ hoạt động sau khi Tà Xùa Trip bật dịch vụ email. Hiện tại vui lòng liên hệ Tà Xùa Trip để được hỗ trợ.');
    }
    const email = normalizeEmail(rawEmail);
    if (!email) return fail(400, 'INVALID_EMAIL', 'Vui lòng nhập email hợp lệ.');
    const u = await this.d1.prepare("SELECT id, email, full_name, status FROM profiles WHERE LOWER(email) = ?").bind(email).first<any>();
    if (u && u.status === 'active') await this.issueCode(u, 'reset_password', now);
    return { ok: true as const, data: { message: 'Nếu email đã đăng ký, mã đặt lại mật khẩu đã được gửi. Mã có hiệu lực 15 phút.' } };
  }

  async resetPassword(input: any, now = new Date()) {
    const email = normalizeEmail(input?.email);
    const bad = fail(400, 'INVALID_CODE', 'Mã không đúng hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
    if (!email) return bad;
    const u = await this.d1.prepare("SELECT id, email, status FROM profiles WHERE LOWER(email) = ?").bind(email).first<any>();
    if (!u || u.status !== 'active') return bad;
    const weak = checkPassword(String(input?.newPassword ?? ''), u.email);
    if (weak) return fail(400, 'WEAK_PASSWORD', weak);
    const nowIso = now.toISOString();
    const r = await this.consumeCode(u.id, 'reset_password', String(input?.code || '').trim(), now, [
      this.d1
        .prepare(
          `UPDATE profiles SET password_hash = ?, password_changed_at = ?, failed_login_count = 0, login_locked_until = NULL,
             email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?`
        )
        .bind(hashPassword(String(input.newPassword)), nowIso, nowIso, nowIso, u.id),
      this.d1.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(nowIso, u.id),
    ]);
    if (!r.ok) return r;
    return { ok: true as const, data: { message: 'Đã đặt mật khẩu mới. Vui lòng đăng nhập lại.' } };
  }
}
