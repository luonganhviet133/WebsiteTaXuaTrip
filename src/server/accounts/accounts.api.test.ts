import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { MemoryEmailSender } from '../email.ts';
import { TERMS_VERSION } from './rules.ts';
import { TURNSTILE_TEST_SECRET } from '../antiAbuse.ts';

const TS = '1x0000000000000000000000000000000AA';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari';

async function setup(withEmail = true) {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const mail = new MemoryEmailSender();
  const ctx: ApiContext = { db, clientIp: `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, revidBaseUrl: '', revidApiKey: '', runtime: 'node', turnstileSecret: TURNSTILE_TEST_SECRET, ...(withEmail ? { email: mail } : {}) };
  const call = async (method: string, path: string, token?: string, body?: unknown, ua = UA) => {
    const headers: Record<string, string> = { 'User-Agent': ua };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  const reg = (over: Record<string, unknown> = {}) =>
    call('POST', '/api/auth/register', undefined, {
      email: `khach.${Math.random().toString(36).slice(2, 8)}@gmail.com`, password: 'MayTaXua26', fullName: 'Nguyễn Văn Khách', role: 'traveler',
      termsAccepted: true, termsVersion: TERMS_VERSION, turnstileToken: TS, ...over,
    });
  const login = (identifier: string, password: string, ua = UA) => call('POST', '/api/auth/login', undefined, { identifier, password, turnstileToken: TS }, ua);
  const lastCode = () => {
    const m = mail.sent[mail.sent.length - 1];
    return m ? m.subject.match(/(\d{6})$/)![1] : '';
  };
  return { db, ctx, mail, call, reg, login, lastCode };
}

test('Đăng ký: bắt buộc email thật, mật khẩu ≥ 8, đồng ý điều khoản; lưu phiên bản điều khoản; không tự lên admin', async () => {
  const { db, reg, mail } = await setup();
  assert.equal((await reg({ email: '0912345678' })).body.code, 'INVALID_EMAIL', 'chỉ số điện thoại thì không đăng ký được');
  assert.equal((await reg({ password: 'Ab12345' })).body.code, 'WEAK_PASSWORD');
  assert.equal((await reg({ password: '12345678' })).body.code, 'WEAK_PASSWORD');
  assert.equal((await reg({ termsAccepted: false })).body.code, 'TERMS_REQUIRED');
  assert.equal((await reg({ termsVersion: '2020-01-01' })).body.code, 'TERMS_REQUIRED', 'điều khoản cũ phải đọc lại');
  assert.equal((await reg({ role: 'admin' })).status, 403);
  assert.equal((await reg({ phone: '12345' })).body.code, 'INVALID_PHONE');
  const ok = await reg({ email: 'Khach.Moi@Gmail.com', phone: '+84 912 000 111' });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.equal(ok.body.user.email, 'khach.moi@gmail.com');
  assert.equal(ok.body.user.phone, '0912000111');
  assert.equal(ok.body.emailVerificationSent, true);
  assert.equal(mail.sent[0].to, 'khach.moi@gmail.com');
  const row = await db.d1.prepare('SELECT terms_version, role, status FROM profiles WHERE email = ?').bind('khach.moi@gmail.com').first<any>();
  assert.deepEqual({ ...row }, { terms_version: TERMS_VERSION, role: 'traveler', status: 'active' });
  assert.equal((await reg({ email: 'khach.moi@gmail.com' })).status, 409);
  assert.equal((await reg({ phone: '0912000111' })).body.code, 'PHONE_EXISTS');
});

test('Đối tác: cần SĐT và tên cơ sở; tạo hồ sơ chờ admin xác minh, chưa sở hữu cơ sở nào', async () => {
  const { db, reg } = await setup();
  assert.equal((await reg({ role: 'partner', facilityName: 'Homestay Mới' })).body.code, 'PHONE_REQUIRED');
  assert.equal((await reg({ role: 'partner', phone: '0987000222' })).body.code, 'INVALID_BUSINESS');
  const r = await reg({ role: 'partner', phone: '0987000222', facilityName: 'Homestay Mây Mới' });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.user.ownedListingIds, []);
  const pr = await db.d1.prepare('SELECT business_name, verification_status FROM providers WHERE user_id = ?').bind(r.body.user.id).first<any>();
  assert.deepEqual({ ...pr }, { business_name: 'Homestay Mây Mới', verification_status: 'pending' });
});

test('Đăng nhập sai 5 lần thì khóa tạm 15 phút (kể cả đúng mật khẩu); hết hạn thì vào được', async () => {
  const { db, reg, login } = await setup();
  const r = await reg({ email: 'khoa.tam@gmail.com' });
  for (let i = 1; i <= 4; i++) assert.equal((await login('khoa.tam@gmail.com', 'SaiMatKhau1')).status, 401);
  const fifth = await login('khoa.tam@gmail.com', 'SaiMatKhau1');
  assert.equal(fifth.status, 429);
  assert.equal(fifth.body.code, 'TOO_MANY_ATTEMPTS');
  assert.equal((await login('khoa.tam@gmail.com', 'MayTaXua26')).status, 429, 'đang khóa thì không kiểm mật khẩu');
  await db.d1.prepare("UPDATE profiles SET login_locked_until = '2000-01-01T00:00:00.000Z' WHERE id = ?").bind(r.body.user.id).run();
  assert.equal((await login('khoa.tam@gmail.com', 'MayTaXua26')).status, 200);
  const row = await db.d1.prepare('SELECT failed_login_count FROM profiles WHERE id = ?').bind(r.body.user.id).first<any>();
  assert.equal(row.failed_login_count, 0, 'đăng nhập đúng thì đếm lại từ 0');
});

test('Tài khoản bị khóa: không đăng nhập được và mọi phiên đang mở mất hiệu lực ngay', async () => {
  const { db, reg, login, call } = await setup();
  const r = await reg({ email: 'bi.khoa@gmail.com' });
  const token = r.body.token;
  assert.equal((await call('GET', '/api/auth/me', token)).status, 200);
  await db.d1.prepare("UPDATE profiles SET status = 'locked', status_reason = 'Gian lận' WHERE id = ?").bind(r.body.user.id).run();
  assert.equal((await call('GET', '/api/auth/me', token)).status, 401, 'phiên cũ hết hiệu lực');
  const l = await login('bi.khoa@gmail.com', 'MayTaXua26');
  assert.equal(l.status, 403);
  assert.equal(l.body.code, 'ACCOUNT_LOCKED');
  assert.equal((await login('bi.khoa@gmail.com', 'SaiMatKhau1')).body.code, 'INVALID_CREDENTIALS', 'sai mật khẩu thì không lộ trạng thái khóa');
});

test('Phiên đăng nhập: xem theo thiết bị, đăng xuất một phiên, đăng xuất các thiết bị khác', async () => {
  const { reg, login, call } = await setup();
  const r = await reg({ email: 'nhieu.may@gmail.com' });
  const a = r.body.token;
  const b = (await login('nhieu.may@gmail.com', 'MayTaXua26', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36')).body.token;
  const c = (await login('nhieu.may@gmail.com', 'MayTaXua26', 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36')).body.token;
  const list = (await call('GET', '/api/me/sessions', a)).body.data;
  assert.equal(list.length, 3);
  assert.deepEqual(list.filter((s: any) => s.current).map((s: any) => s.device), ['iPhone · Safari']);
  assert.deepEqual(list.map((s: any) => s.device).sort(), ['Android · Chrome', 'Windows · Chrome', 'iPhone · Safari']);
  const win = list.find((s: any) => s.device === 'Windows · Chrome');
  assert.equal((await call('DELETE', `/api/me/sessions/${win.id}`, a)).status, 200);
  assert.equal((await call('GET', '/api/auth/me', b)).status, 401);
  const other = await reg({ email: 'nguoi.khac@gmail.com' });
  assert.equal((await call('DELETE', `/api/me/sessions/${list[0].id}`, other.body.token)).status, 404, 'không thu hồi phiên của người khác');
  assert.equal((await call('POST', '/api/me/sessions/revoke-others', a)).body.data.revoked, 1);
  assert.equal((await call('GET', '/api/auth/me', c)).status, 401);
  assert.equal((await call('GET', '/api/auth/me', a)).status, 200, 'phiên hiện tại giữ nguyên');
});

test('Hồ sơ của tôi: sửa họ tên, SĐT (chuẩn hóa, không trùng); đối tác sửa tên cơ sở', async () => {
  const { reg, call } = await setup();
  const r = await reg({ email: 'ho.so@gmail.com' });
  const t = r.body.token;
  const p = await call('PUT', '/api/me/profile', t, { fullName: '  Trần   Thị Mây ', phone: '0909 111 222' });
  assert.equal(p.status, 200);
  assert.equal(p.body.data.fullName, 'Trần Thị Mây');
  assert.equal(p.body.data.phone, '0909111222');
  assert.equal((await call('PUT', '/api/me/profile', t, { fullName: 'A' })).body.code, 'INVALID_NAME');
  await reg({ email: 'trung.sdt@gmail.com', phone: '0909333444' });
  assert.equal((await call('PUT', '/api/me/profile', t, { fullName: 'Trần Thị Mây', phone: '0909333444' })).body.code, 'PHONE_EXISTS');
  const partner = await reg({ email: 'doi.tac@gmail.com', role: 'partner', phone: '0988777666', facilityName: 'Nhà Mây' });
  const pp = await call('PUT', '/api/me/profile', partner.body.token, { fullName: 'Chủ Nhà Mây', phone: '0988777666', businessName: 'Nhà Mây Tà Xùa' });
  assert.equal(pp.body.data.businessName, 'Nhà Mây Tà Xùa');
  assert.equal(pp.body.data.partnerVerification, 'pending');
  assert.equal((await call('PUT', '/api/me/profile', partner.body.token, { fullName: 'Chủ Nhà Mây', phone: '' })).body.code, 'PHONE_REQUIRED');
});

test('Xác minh email: mã 6 số đúng thì xác minh; sai quá 5 lần thì mã hết hiệu lực; gửi lại phải chờ 60 giây', async () => {
  const { reg, call, mail, lastCode } = await setup();
  const r = await reg({ email: 'xac.minh@gmail.com' });
  const t = r.body.token;
  assert.equal(mail.sent.length, 1, 'đăng ký đã gửi mã');
  assert.equal((await call('POST', '/api/me/email/send-code', t)).body.code, 'TOO_SOON');
  const code = lastCode();
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await call('POST', '/api/me/email/verify', t, { code: wrong })).body.code, 'INVALID_CODE');
  assert.equal((await call('POST', '/api/me/email/verify', t, { code })).body.code, 'INVALID_CODE', 'đã sai 5 lần thì mã đúng cũng hết hiệu lực');
});

test('Xác minh email thành công và mã chỉ dùng một lần', async () => {
  const { db, reg, call, lastCode } = await setup();
  const r = await reg({ email: 'mot.lan@gmail.com' });
  const code = lastCode();
  const both = await Promise.all([1, 2].map(() => call('POST', '/api/me/email/verify', r.body.token, { code })));
  assert.equal(both.filter((x) => x.status === 200).length, 1, 'hai yêu cầu cùng mã: chỉ một thành công');
  const row = await db.d1.prepare('SELECT email_verified_at FROM profiles WHERE id = ?').bind(r.body.user.id).first<any>();
  assert.ok(row.email_verified_at);
  assert.equal((await call('GET', '/api/me/profile', r.body.token)).body.data.emailVerified, true);
});

test('Quên mật khẩu: trả lời giống nhau dù email có hay không; mã đúng thì đổi mật khẩu, đăng xuất mọi nơi, mở khóa tạm', async () => {
  const { db, reg, call, login, mail, lastCode } = await setup();
  const r = await reg({ email: 'quen.mk@gmail.com' });
  const before = mail.sent.length;
  const a = await call('POST', '/api/auth/forgot-password', undefined, { email: 'quen.mk@gmail.com', turnstileToken: TS });
  const b = await call('POST', '/api/auth/forgot-password', undefined, { email: 'khong.co@gmail.com', turnstileToken: TS });
  assert.equal(a.status, 200);
  assert.deepEqual(a.body.data, b.body.data, 'không lộ email nào đã đăng ký');
  assert.equal(mail.sent.length, before + 1);
  assert.match(mail.sent[mail.sent.length - 1].subject, /đặt lại mật khẩu/);
  const code = lastCode();
  await db.d1.prepare("UPDATE profiles SET login_locked_until = '2999-01-01T00:00:00.000Z' WHERE id = ?").bind(r.body.user.id).run();
  assert.equal((await call('POST', '/api/auth/reset-password', undefined, { email: 'quen.mk@gmail.com', code, newPassword: '123' })).body.code, 'WEAK_PASSWORD');
  assert.equal((await call('POST', '/api/auth/reset-password', undefined, { email: 'quen.mk@gmail.com', code: '999999', newPassword: 'MayMoi2026' })).body.code, 'INVALID_CODE');
  const ok = await call('POST', '/api/auth/reset-password', undefined, { email: 'quen.mk@gmail.com', code, newPassword: 'MayMoi2026' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal((await call('GET', '/api/auth/me', r.body.token)).status, 401, 'phiên cũ bị đăng xuất');
  assert.equal((await login('quen.mk@gmail.com', 'MayTaXua26')).status, 401);
  assert.equal((await login('quen.mk@gmail.com', 'MayMoi2026')).status, 200, 'mật khẩu mới vào được, khóa tạm đã mở');
  assert.equal((await call('POST', '/api/auth/reset-password', undefined, { email: 'quen.mk@gmail.com', code, newPassword: 'MayKhac2026' })).body.code, 'INVALID_CODE', 'mã dùng một lần');
  const log = await db.d1.prepare("SELECT template, status FROM email_log WHERE to_email = 'quen.mk@gmail.com' ORDER BY rowid").all<any>();
  assert.deepEqual(log.results.map((x: any) => `${x.template}:${x.status}`), ['verify_email:sent', 'reset_password:sent']);
});

test('Chưa bật dịch vụ email (gói Free): đăng ký vẫn được; quên mật khẩu và gửi mã báo rõ là chưa bật, không giả đã gửi', async () => {
  const { reg, call } = await setup(false);
  assert.equal((await call('GET', '/api/auth/config')).body.data.emailEnabled, false);
  const r = await reg({ email: 'goi.free@gmail.com' });
  assert.equal(r.status, 201);
  assert.equal(r.body.emailVerificationSent, false);
  const f = await call('POST', '/api/auth/forgot-password', undefined, { email: 'goi.free@gmail.com' });
  assert.equal(f.status, 503);
  assert.equal(f.body.code, 'EMAIL_NOT_CONFIGURED');
  assert.equal((await call('POST', '/api/me/email/send-code', r.body.token)).body.code, 'EMAIL_NOT_CONFIGURED');
});

test('Gửi email lỗi: mã đó hết hiệu lực và ghi nhật ký lỗi', async () => {
  const { db, reg, mail } = await setup();
  mail.failNext = true;
  const r = await reg({ email: 'gui.loi@gmail.com' });
  assert.equal(r.status, 201, 'đăng ký không bị chặn');
  assert.equal(r.body.emailVerificationSent, false);
  const log = await db.d1.prepare("SELECT status FROM email_log WHERE to_email = 'gui.loi@gmail.com'").first<any>();
  assert.equal(log.status, 'failed');
  const open = await db.d1.prepare('SELECT COUNT(*) AS n FROM auth_codes WHERE user_id = ? AND used_at IS NULL').bind(r.body.user.id).first<any>();
  assert.equal(open.n, 0);
});
