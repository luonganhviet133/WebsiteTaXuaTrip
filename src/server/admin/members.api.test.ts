import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { TERMS_VERSION } from '../accounts/rules.ts';
import { TURNSTILE_TEST_SECRET } from '../antiAbuse.ts';

const TS = '1x0000000000000000000000000000000AA';

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = { db, clientIp: `10.2.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, revidBaseUrl: '', revidApiKey: '', runtime: 'node', turnstileSecret: TURNSTILE_TEST_SECRET };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  const login = async (identifier: string, password: string) => {
    const r = await call('POST', '/api/auth/login', undefined, { identifier, password, turnstileToken: TS });
    return r.body.token as string;
  };
  const reg = async (over: Record<string, unknown> = {}) =>
    call('POST', '/api/auth/register', undefined, {
      email: `tv.${Math.random().toString(36).slice(2, 8)}@gmail.com`, password: 'MayTaXua26', fullName: 'Nguyễn Thành Viên', role: 'traveler',
      termsAccepted: true, termsVersion: TERMS_VERSION, turnstileToken: TS, ...over,
    });
  const admin = await login('admin@taxuatrip.vn', 'admin123');
  const idOf = async (email: string) => (await db.d1.prepare('SELECT id FROM profiles WHERE email = ?').bind(email).first<any>()).id as string;
  return { db, call, login, reg, admin, idOf };
}

test('Danh sách thành viên: chỉ admin xem; tìm theo tên/email/SĐT, lọc vai trò/trạng thái/xác minh, phân trang; không lộ mật khẩu', async () => {
  const { call, login, admin } = await setup();
  const traveler = await login('traveler.a@gmail.com', 'traveler123');
  assert.equal((await call('GET', '/api/admin/members', traveler)).status, 403);
  assert.equal((await call('GET', '/api/admin/members')).status, 401);

  const all = await call('GET', '/api/admin/members', admin);
  assert.equal(all.status, 200, JSON.stringify(all.body));
  assert.ok(all.body.data.total >= 5);
  assert.ok(!JSON.stringify(all.body).includes('password'), 'không trả băm mật khẩu');

  const byPhone = await call('GET', '/api/admin/members?q=0981234567', admin);
  assert.deepEqual(byPhone.body.data.items.map((m: any) => m.email), ['partner.a@taxuatrip.vn']);
  assert.equal(byPhone.body.data.items[0].businessName, 'Homestay Mây Tà Xùa');
  assert.equal(byPhone.body.data.items[0].partnerVerification, 'verified');

  const partners = await call('GET', '/api/admin/members?role=partner', admin);
  assert.ok(partners.body.data.items.every((m: any) => m.role === 'partner'));
  assert.equal((await call('GET', '/api/admin/members?q=du%20kh%C3%A1ch%20a', admin)).body.data.items[0].email, 'traveler.a@gmail.com', 'tìm theo tên, không phân biệt hoa thường');

  const page = await call('GET', '/api/admin/members?pageSize=2&page=2', admin);
  assert.equal(page.body.data.items.length, 2);
  assert.equal(page.body.data.page, 2);
  assert.equal((await call('GET', '/api/admin/members?role=hacker', admin)).status, 400);
});

test('Khóa tài khoản: bắt buộc lý do; mất phiên ngay, không đăng nhập được; mở lại thì vào được; có nhật ký', async () => {
  const { call, login, admin, idOf } = await setup();
  const travelerToken = await login('traveler.a@gmail.com', 'traveler123');
  const id = await idOf('traveler.a@gmail.com');

  assert.equal((await call('POST', `/api/admin/members/${id}/lock`, admin, { reason: '' })).body.code, 'REASON_REQUIRED');
  const lock = await call('POST', `/api/admin/members/${id}/lock`, admin, { reason: 'Đặt phòng ảo nhiều lần' });
  assert.equal(lock.status, 200, JSON.stringify(lock.body));
  assert.equal(lock.body.data.status, 'locked');
  assert.equal((await call('GET', '/api/auth/me', travelerToken)).status, 401, 'phiên cũ mất hiệu lực ngay');
  const relogin = await call('POST', '/api/auth/login', undefined, { identifier: 'traveler.a@gmail.com', password: 'traveler123', turnstileToken: TS });
  assert.equal(relogin.body.code, 'ACCOUNT_LOCKED');

  const again = await call('POST', `/api/admin/members/${id}/lock`, admin, { reason: 'Bấm lặp' });
  assert.equal(again.body.already, true, 'khóa lặp không ghi thêm');

  const unlock = await call('POST', `/api/admin/members/${id}/unlock`, admin, { reason: 'Đã gọi điện xác minh' });
  assert.equal(unlock.body.data.status, 'active');
  assert.ok(await login('traveler.a@gmail.com', 'traveler123'));

  const detail = await call('GET', `/api/admin/members/${id}`, admin);
  assert.deepEqual(detail.body.data.history.map((h: any) => h.action), ['member.unlock', 'member.lock']);
  assert.equal(detail.body.data.history[1].reason, 'Đặt phòng ảo nhiều lần');
  assert.equal(detail.body.data.history[1].actorName, 'Super Admin Test');
});

test('Mở khóa cũng xóa khóa tạm do sai mật khẩu', async () => {
  const { db, call, admin, idOf } = await setup();
  const id = await idOf('traveler.a@gmail.com');
  await db.d1.prepare("UPDATE profiles SET failed_login_count = 5, login_locked_until = '2999-01-01T00:00:00.000Z' WHERE id = ?").bind(id).run();
  const list = await call('GET', '/api/admin/members?q=traveler.a', admin);
  assert.equal(list.body.data.items[0].loginLocked, true);
  await call('POST', `/api/admin/members/${id}/unlock`, admin, { reason: 'Khách gọi điện' });
  const row = await db.d1.prepare('SELECT failed_login_count, login_locked_until FROM profiles WHERE id = ?').bind(id).first<any>();
  assert.deepEqual({ ...row }, { failed_login_count: 0, login_locked_until: null });
});

test('Đổi vai trò: lên admin có hiệu lực ngay; không tự đổi/khóa chính mình; không bỏ admin cuối cùng', async () => {
  const { call, login, reg, admin, idOf } = await setup();
  const adminId = await idOf('admin@taxuatrip.vn');
  assert.equal((await call('POST', `/api/admin/members/${adminId}/role`, admin, { role: 'traveler', reason: 'thử' })).body.code, 'SELF_ACTION');
  assert.equal((await call('POST', `/api/admin/members/${adminId}/lock`, admin, { reason: 'thử tự khóa' })).body.code, 'SELF_ACTION');

  const r = await reg({ email: 'vanhuy.test@gmail.com' });
  const newId = r.body.user.id;
  assert.equal((await call('POST', `/api/admin/members/${newId}/role`, admin, { role: 'admin' })).body.code, 'REASON_REQUIRED');
  const up = await call('POST', `/api/admin/members/${newId}/role`, admin, { role: 'admin', reason: 'Quản trị viên Tà Xùa Trip' });
  assert.equal(up.status, 200, JSON.stringify(up.body));
  const t2 = await login('vanhuy.test@gmail.com', 'MayTaXua26');
  assert.equal((await call('GET', '/api/admin/members', t2)).status, 200, 'admin mới dùng được trang quản trị');

  // Admin mới hạ admin cũ: được, vì còn một admin.
  assert.equal((await call('POST', `/api/admin/members/${adminId}/role`, t2, { role: 'traveler', reason: 'Bàn giao' })).status, 200);
  assert.equal((await call('GET', '/api/admin/members', admin)).status, 401, 'admin cũ bị hạ: phiên cũ mất hiệu lực ngay');
});

test('Không khóa hay hạ được admin cuối cùng đang hoạt động; có admin thứ hai thì được', async () => {
  const { db, call, reg, admin, idOf } = await setup();
  const { MemberAdminStore } = await import('./members.ts');
  const store = new MemberAdminStore(db.d1);
  const adminId = await idOf('admin@taxuatrip.vn');
  const now = new Date();
  assert.equal(((await store.lock(adminId, 'u_khac', 'Thử khóa admin cuối', now)) as any).code, 'LAST_ADMIN');
  assert.equal(((await store.setRole(adminId, 'u_khac', 'traveler', 'Thử hạ admin cuối', now)) as any).code, 'LAST_ADMIN');
  const still = await db.d1.prepare('SELECT role, status FROM profiles WHERE id = ?').bind(adminId).first<any>();
  assert.deepEqual({ ...still }, { role: 'admin', status: 'active' }, 'không đổi gì');

  const r = await reg({ email: 'admin2.test@gmail.com' });
  await call('POST', `/api/admin/members/${r.body.user.id}/role`, admin, { role: 'admin', reason: 'Thêm quản trị' });
  assert.equal((await store.lock(adminId, 'u_khac', 'Nghỉ việc', now)).ok, true);
  // Admin gốc đã khóa: admin2 là admin hoạt động cuối cùng.
  assert.equal(((await store.lock(r.body.user.id, 'u_khac', 'Thử khóa nốt', now)) as any).code, 'LAST_ADMIN');
});

test('Thành viên lên đối tác: tạo hồ sơ đối tác chờ xác minh; đổi vai trò làm mất phiên cũ', async () => {
  const { db, call, login, reg, admin } = await setup();
  const r = await reg({ email: 'len.doitac@gmail.com', phone: '0911222333' });
  const tok = await login('len.doitac@gmail.com', 'MayTaXua26');
  const res = await call('POST', `/api/admin/members/${r.body.user.id}/role`, admin, { role: 'partner', reason: 'Chủ homestay đã gọi điện' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.role, 'partner');
  assert.equal(res.body.data.partnerVerification, 'pending');
  const pr = await db.d1.prepare('SELECT business_name, phone FROM providers WHERE user_id = ?').bind(r.body.user.id).first<any>();
  assert.deepEqual({ ...pr }, { business_name: 'Nguyễn Thành Viên', phone: '0911222333' });
  assert.equal((await call('GET', '/api/auth/me', tok)).status, 401, 'đăng nhập lại để nhận quyền mới');
});

test('Xác minh đối tác: duyệt/từ chối có ghi chú và nhật ký; chỉ áp dụng cho đối tác', async () => {
  const { db, call, reg, admin, idOf } = await setup();
  const p = await reg({ role: 'partner', email: 'chu.homestay@gmail.com', phone: '0977000111', facilityName: 'Homestay Săn Mây' });
  const id = p.body.user.id;
  assert.equal((await call('POST', `/api/admin/members/${id}/partner-verification`, admin, { status: 'bogus', note: 'x' })).status, 400);
  const rej = await call('POST', `/api/admin/members/${id}/partner-verification`, admin, { status: 'rejected', note: 'Không liên lạc được' });
  assert.equal(rej.body.data.partnerVerification, 'rejected');
  const ok = await call('POST', `/api/admin/members/${id}/partner-verification`, admin, { status: 'verified', note: 'Đã gọi 0977000111, xác nhận chủ cơ sở' });
  assert.equal(ok.body.data.partnerVerification, 'verified');
  const row = await db.d1.prepare('SELECT verified_at, verified_by FROM providers WHERE user_id = ?').bind(id).first<any>();
  assert.ok(row.verified_at);
  assert.equal(row.verified_by, await idOf('admin@taxuatrip.vn'));
  const detail = await call('GET', `/api/admin/members/${id}`, admin);
  assert.deepEqual(detail.body.data.history.map((h: any) => [h.action, h.detail.status]), [['partner.verify', 'verified'], ['partner.verify', 'rejected']]);
  const traveler = await idOf('traveler.a@gmail.com');
  assert.equal((await call('POST', `/api/admin/members/${traveler}/partner-verification`, admin, { status: 'verified', note: 'ok' })).body.code, 'NOT_PARTNER');
});

test('Mã đặt lại mật khẩu do admin cấp: hiện một lần, dùng bằng SĐT (tài khoản cũ không có email), không đánh dấu email đã xác minh', async () => {
  const { db, call, admin } = await setup();
  await db.d1
    .prepare("INSERT INTO profiles (id, email, phone, password_hash, full_name, role, is_verified, created_at, updated_at) VALUES ('u_old', '0985564756@taxuatrip.user', '0985564756', 'x', 'Khách Cũ', 'traveler', 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')")
    .run();
  const issued = await call('POST', '/api/admin/members/u_old/reset-code', admin, { reason: 'Khách gọi điện quên mật khẩu' });
  assert.equal(issued.status, 200, JSON.stringify(issued.body));
  assert.match(issued.body.data.code, /^\d{6}$/);
  assert.ok(issued.body.data.expiresAt);
  const stored = await db.d1.prepare("SELECT code_hash, sent_to FROM auth_codes WHERE user_id = 'u_old'").first<any>();
  assert.notEqual(stored.code_hash, issued.body.data.code, 'chỉ lưu băm');
  assert.equal(stored.sent_to, 'admin');

  const wrong = await call('POST', '/api/auth/reset-password', undefined, { identifier: '0985564756', code: '000000', newPassword: 'MayMoi2026' });
  assert.equal(wrong.body.code, 'INVALID_CODE');
  const ok = await call('POST', '/api/auth/reset-password', undefined, { identifier: '0985 564 756', code: issued.body.data.code, newPassword: 'MayMoi2026' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const login = await call('POST', '/api/auth/login', undefined, { identifier: '0985564756', password: 'MayMoi2026', turnstileToken: TS });
  assert.equal(login.status, 200);
  const prof = await db.d1.prepare("SELECT email_verified_at FROM profiles WHERE id = 'u_old'").first<any>();
  assert.equal(prof.email_verified_at, null, 'mã admin đọc qua điện thoại không chứng minh email');
  const reuse = await call('POST', '/api/auth/reset-password', undefined, { identifier: '0985564756', code: issued.body.data.code, newPassword: 'MayMoi2027' });
  assert.equal(reuse.body.code, 'INVALID_CODE', 'mã chỉ dùng một lần');

  const detail = await call('GET', '/api/admin/members/u_old', admin);
  assert.equal(detail.body.data.history[0].action, 'member.reset_code');
  assert.ok(!JSON.stringify(detail.body).includes(issued.body.data.code), 'nhật ký không chứa mã');
});

test('Không cấp mã cho tài khoản đang khóa hoặc cho chính mình', async () => {
  const { call, admin, idOf } = await setup();
  const id = await idOf('traveler.a@gmail.com');
  await call('POST', `/api/admin/members/${id}/lock`, admin, { reason: 'Vi phạm điều khoản' });
  assert.equal((await call('POST', `/api/admin/members/${id}/reset-code`, admin, { reason: 'Khách gọi' })).body.code, 'ACCOUNT_LOCKED');
  assert.equal((await call('POST', `/api/admin/members/${await idOf('admin@taxuatrip.vn')}/reset-code`, admin, { reason: 'tự cấp' })).body.code, 'SELF_ACTION');
  assert.equal((await call('POST', '/api/admin/members/khong_co/lock', admin, { reason: 'không tồn tại' })).status, 404);
});

test('Tổng quan admin: số thật từ cơ sở dữ liệu', async () => {
  const { call, admin, reg } = await setup();
  await reg({ role: 'partner', email: 'cho.duyet@gmail.com', phone: '0966000111', facilityName: 'Homestay Chờ Duyệt' });
  const o = await call('GET', '/api/admin/overview', admin);
  assert.equal(o.status, 200);
  const d = o.body.data;
  assert.equal(d.members.partner, 3);
  assert.equal(d.members.admin, 1);
  assert.equal(d.partnersPending, 1);
  assert.equal(d.members.locked, 0);
  assert.equal(typeof d.totalBookings, 'number');
  assert.equal(typeof d.listings, 'number');
  assert.equal(typeof d.openComplaints, 'number');
  assert.equal(typeof d.newMembers7d, 'number');
});
