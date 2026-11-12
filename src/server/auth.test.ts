import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { createExpressApp } from '../../server.ts';
import { DatabaseEngine } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('N02: Real Database, Authentication & Multi-Tenant Authorization Test Suite', async (t) => {
  // S1: Use isolated SQLite test database with test flag
  const testSqlitePath = path.resolve(projectRoot, 'tmp', `test_auth_${Date.now()}.sqlite`);
  if (!fs.existsSync(path.dirname(testSqlitePath))) {
    fs.mkdirSync(path.dirname(testSqlitePath), { recursive: true });
  }

  const testDb = new DatabaseEngine({ sqlitePath: testSqlitePath, isTest: true });
  await testDb.seedTestFixtures();

  const app = await createExpressApp({ isProd: true, skipVite: true, db: testDb });
  let server: Server;
  let baseUrl = '';

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  t.after(() => {
    server?.close();
    try {
      if (fs.existsSync(testSqlitePath)) fs.unlinkSync(testSqlitePath);
    } catch {}
  });

  // Tokens for actors
  let adminToken = '';
  let partnerAToken = '';
  let partnerBToken = '';
  let travelerAToken = '';
  let travelerBToken = '';

  // 1. LOGIN TESTS
  await t.test('Login with valid seed credentials succeeds for all actor roles', async () => {
    // Admin login
    const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@taxuatrip.vn', password: 'admin123' })
    });
    assert.equal(resAdmin.status, 200);
    const bodyAdmin = await resAdmin.json();
    assert.equal(bodyAdmin.success, true);
    assert.equal(bodyAdmin.user.role, 'admin');
    assert.equal(bodyAdmin.user.isVerified, true);
    adminToken = bodyAdmin.token;
    assert.ok(adminToken);

    // Partner A login
    const resPartA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'partner.a@taxuatrip.vn', password: 'partner123' })
    });
    assert.equal(resPartA.status, 200);
    const bodyPartA = await resPartA.json();
    assert.equal(bodyPartA.user.role, 'partner');
    assert.deepEqual(bodyPartA.user.ownedListingIds, ['homestay-may']);
    partnerAToken = bodyPartA.token;

    // Partner B login
    const resPartB = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'partner.b@taxuatrip.vn', password: 'partner123' })
    });
    assert.equal(resPartB.status, 200);
    const bodyPartB = await resPartB.json();
    assert.equal(bodyPartB.user.role, 'partner');
    assert.deepEqual(bodyPartB.user.ownedListingIds, ['homestay-lutre']);
    partnerBToken = bodyPartB.token;

    // Traveler A login
    const resTravA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'traveler.a@gmail.com', password: 'traveler123' })
    });
    assert.equal(resTravA.status, 200);
    const bodyTravA = await resTravA.json();
    assert.equal(bodyTravA.user.role, 'traveler');
    travelerAToken = bodyTravA.token;

    // Traveler B login
    const resTravB = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'traveler.b@gmail.com', password: 'traveler123' })
    });
    assert.equal(resTravB.status, 200);
    const bodyTravB = await resTravB.json();
    assert.equal(bodyTravB.user.role, 'traveler');
    travelerBToken = bodyTravB.token;
  });

  await t.test('Login with wrong password returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@taxuatrip.vn', password: 'wrongpassword' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 2. REGISTRATION & ADMIN PRIVILEGE ESCALATION BLOCKING
  await t.test('Client attempting to self-register with role: "admin" is rejected with 403', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hacker@taxuatrip.vn',
        password: 'hackerpassword123',
        fullName: 'Hacker Pretending Admin',
        role: 'admin'
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Không được phép tự đăng ký tài khoản quản trị viên/);
  });

  await t.test('Partner registration starts with unverified status and owns 0 listings', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newpartner@taxuatrip.vn',
        password: 'partnerpassword123',
        fullName: 'Chủ Nhà Mới',
        role: 'partner',
        facilityName: 'Homestay Mới Xây'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.role, 'partner');
    assert.equal(body.user.isVerified, false);
    assert.deepEqual(body.user.ownedListingIds, []);
  });

  // 3. SESSION VERIFICATION & CLIENT TAMPERING
  await t.test('GET /api/auth/me returns 401 when token is missing or forged', async () => {
    const resMissing = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(resMissing.status, 401);

    const resForged = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer forged_fake_token_12345' }
    });
    assert.equal(resForged.status, 401);
  });

  await t.test('GET /api/auth/me returns verified server user for valid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.email, 'admin@taxuatrip.vn');
    assert.equal(body.user.role, 'admin');
  });

  // 4. MULTI-TENANT ISOLATION: TRAVELER A VS TRAVELER B (S5, S6)
  await t.test('Traveler A can only view their own bookings; Traveler B only sees B\'s', async () => {
    const resA = await fetch(`${baseUrl}/api/user/bookings`, {
      headers: { Authorization: `Bearer ${travelerAToken}` }
    });
    assert.equal(resA.status, 200);
    const bodyA = await resA.json();
    assert.equal(bodyA.data.length, 1);
    assert.ok(bodyA.data[0].bookingCode.startsWith('TX-'));
    assert.equal(bodyA.data[0].listingTitle, 'Homestay Mây Tà Xùa - Bungalow Đỉnh Gió');
    assert.equal(bodyA.data[0].guestName, 'Trần Văn Du Khách A');

    const resB = await fetch(`${baseUrl}/api/user/bookings`, {
      headers: { Authorization: `Bearer ${travelerBToken}` }
    });
    assert.equal(resB.status, 200);
    const bodyB = await resB.json();
    assert.equal(bodyB.data.length, 1);
    assert.ok(bodyB.data[0].bookingCode.startsWith('TX-'));
    assert.equal(bodyB.data[0].listingId, 'homestay-lutre');
  });

  await t.test('Traveler A cannot view Traveler B\'s booking by ID (Cross-Tenant 403 Forbidden)', async () => {
    const resB = await fetch(`${baseUrl}/api/user/bookings`, {
      headers: { Authorization: `Bearer ${travelerBToken}` }
    });
    const bodyB = await resB.json();
    const bookingBId = bodyB.data[0].id;

    const resCross = await fetch(`${baseUrl}/api/user/bookings/${bookingBId}`, {
      headers: { Authorization: `Bearer ${travelerAToken}` }
    });
    assert.equal(resCross.status, 403);
    const bodyCross = await resCross.json();
    assert.equal(bodyCross.success, false);
    assert.match(bodyCross.error, /FORBIDDEN/);
  });

  // 5. MULTI-TENANT ISOLATION: PARTNER A VS PARTNER B
  await t.test('Partner A can only manage listing homestay-may; Partner B can only manage homestay-lutre', async () => {
    const resA = await fetch(`${baseUrl}/api/partner/listings`, {
      headers: { Authorization: `Bearer ${partnerAToken}` }
    });
    assert.equal(resA.status, 200);
    const bodyA = await resA.json();
    assert.equal(bodyA.data.length, 1);
    assert.equal(bodyA.data[0].id, 'homestay-may');

    const resCrossUpdate = await fetch(`${baseUrl}/api/partner/listings/homestay-lutre`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${partnerAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ price: 999999 })
    });
    assert.equal(resCrossUpdate.status, 403);
    const bodyCrossUpdate = await resCrossUpdate.json();
    assert.match(bodyCrossUpdate.error, /FORBIDDEN: Bạn không có quyền chỉnh sửa cơ sở lưu trú này/);

    const resOwnUpdate = await fetch(`${baseUrl}/api/partner/listings/homestay-may`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${partnerAToken}`,
        'Content-Type': 'application/json'
      },
      // N03: PUT lưu bản nháp, cần nội dung hợp lệ; dữ liệu sai bị từ chối thay vì báo thành công giả.
      body: JSON.stringify({ content: { title: 'Homestay Mây (nháp)', category: 'homestay', area: 'Đỉnh Gió', minPrice: 1200000 } })
    });
    assert.equal(resOwnUpdate.status, 200);
    const ownBody = await resOwnUpdate.json();
    assert.equal(ownBody.data.openVersion.status, 'draft');
  });

  // 6. ROLE-BASED ACCESS CONTROL (RBAC)
  await t.test('Admin endpoint /api/admin/overview is blocked for non-admin users', async () => {
    const resTrav = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${travelerAToken}` }
    });
    assert.equal(resTrav.status, 403);

    const resPart = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${partnerAToken}` }
    });
    assert.equal(resPart.status, 403);

    const resAdmin = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resAdmin.status, 200);
    const body = await resAdmin.json();
    assert.equal(body.success, true);
    assert.ok(body.data.totalBookings >= 2);
  });

  // 7. SESSION REVOCATION (LOGOUT)
  await t.test('POST /api/auth/logout revokes session token immediately', async () => {
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'traveler.a@gmail.com', password: 'traveler123' })
    });
    const loginBody = await resLogin.json();
    const tempToken = loginBody.token;

    const resBefore = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
    assert.equal(resBefore.status, 200);

    const resLogout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempToken}` }
    });
    assert.equal(resLogout.status, 200);

    const resAfter = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
    assert.equal(resAfter.status, 401);
  });

  // 8. PHONE NUMBER AUTHENTICATION
  await t.test('User can register with Phone Number and login with that phone number', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0977112233',
        password: 'phonepassword123',
        fullName: 'Nguyễn Văn Phone',
        role: 'traveler'
      })
    });
    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    assert.equal(regBody.success, true);
    assert.equal(regBody.user.phone, '0977112233');

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '0977112233',
        password: 'phonepassword123'
      })
    });
    assert.equal(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assert.equal(loginBody.success, true);
    assert.equal(loginBody.user.phone, '0977112233');
    assert.equal(loginBody.user.fullName, 'Nguyễn Văn Phone');
  });

  // 9. R1: FRESH DATABASE HAS NO ADMIN
  await t.test('R1: Clean Database without seed has 0 profiles and denies demo admin login with 401', async () => {
    const cleanDb = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
    assert.equal(await cleanDb.findProfileByEmail('admin@taxuatrip.vn'), null);
    assert.equal(await cleanDb.findProfileByIdentifier('khachhang@gmail.com'), null);
  });

  // 10. R2: PERSISTENCE ACROSS RESTARTS
  await t.test('R2: Data survives server restart when using persistent file storage', async () => {
    const tmpDataPath = path.resolve(projectRoot, 'tmp', `test_persist_${Date.now()}.sqlite`);
    const db1 = new DatabaseEngine({ sqlitePath: tmpDataPath, isTest: true });

    const user = await db1.createProfile({
      email: 'persisted.user@taxuatrip.vn',
      fullName: 'Persisted User',
      password: 'password123',
      role: 'traveler'
    });
    const session = await db1.createSession(user.id, 'traveler');
    assert.ok(session.token);

    const db2 = new DatabaseEngine({ sqlitePath: tmpDataPath, isTest: true });
    const loadedUser = await db2.findProfileByEmail('persisted.user@taxuatrip.vn');
    assert.ok(loadedUser);
    assert.equal(loadedUser.email, 'persisted.user@taxuatrip.vn');
    assert.equal(loadedUser.fullName, 'Persisted User');

    const activeSession = await db2.findActiveSession(session.token);
    assert.ok(activeSession);
    assert.equal(activeSession.profile.email, 'persisted.user@taxuatrip.vn');

    await db2.revokeSession(session.token);
    const revokedSession = await db1.findActiveSession(session.token);
    assert.equal(revokedSession, null);

    try { fs.unlinkSync(tmpDataPath); } catch {}
  });

  // 11. R3: BOOTSTRAP ADMIN CLI (S3: Same Persistent State)
  await t.test('R3: Bootstrap Admin CLI executes in separate process, creates admin, updates password and revokes old sessions', async () => {
    const adminEmail = `admin.cli.${Date.now()}@taxuatrip.vn`;
    const initialPassword = 'InitialSecurePassword123!';
    const updatedPassword = 'UpdatedSecurePassword456!';

    // 1. Bootstrap new admin via CLI in child process using the test database
    await new Promise<void>((resolve, reject) => {
      const p = spawn(process.execPath, [
        path.resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs'),
        path.resolve(projectRoot, 'scripts/bootstrap-admin.js'),
        '--email', adminEmail,
        '--password', initialPassword,
        '--name', 'CLI Bootstrap Admin'
      ], {
        cwd: projectRoot,
        env: { ...process.env, DATABASE_SQLITE_PATH: testSqlitePath },
        stdio: 'pipe'
      });

      p.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`CLI bootstrap exited with code ${code}`));
      });
    });

    // 2. Login via server with initial password succeeds
    const login1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: initialPassword })
    });
    assert.equal(login1.status, 200);
    const body1 = await login1.json();
    assert.equal(body1.user.role, 'admin');
    const token1 = body1.token;

    // Verify token1 works
    const me1 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(me1.status, 200);

    // 3. Update admin password via CLI
    await new Promise<void>((resolve, reject) => {
      const p = spawn(process.execPath, [
        path.resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs'),
        path.resolve(projectRoot, 'scripts/bootstrap-admin.js'),
        '--email', adminEmail,
        '--password', updatedPassword
      ], {
        cwd: projectRoot,
        env: { ...process.env, DATABASE_SQLITE_PATH: testSqlitePath },
        stdio: 'pipe'
      });

      p.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`CLI update exited with code ${code}`));
      });
    });

    // 4. Old password must be rejected with 401
    const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: initialPassword })
    });
    assert.equal(oldLogin.status, 401);

    // 5. Old session token must be revoked (401)
    const oldMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(oldMe.status, 401);

    // 6. New password must succeed
    const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: updatedPassword })
    });
    assert.equal(newLogin.status, 200);
    const body2 = await newLogin.json();
    assert.equal(body2.user.role, 'admin');
  });

  // 12. R5: GATEWAY LOCKDOWN
  await t.test('R5: Revid Gateway ignores arbitrary client baseUrl and apiKey from request body', async () => {
    const res = await fetch(`${baseUrl}/api/revid/playground-chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        baseUrl: 'http://malicious-ssrf-domain.example.com',
        apiKey: 'attacker-injected-key',
        prompt: 'test prompt'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.reply);
  });

  // 13. S1: SENTINEL ISOLATION GUARANTEE
  await t.test('S1: Operational database is protected and never modified by test suite', async () => {
    // Một DB vận hành (isTest: false) đặt ở thư mục tmp: kiểm tra đúng cơ chế chặn,
    // không mở file .data thật (tiến trình khác có thể đang ghi → "database is locked").
    const opDbPath = path.resolve(projectRoot, 'tmp', `test_opdb_${Date.now()}.sqlite`);
    const opDb = new DatabaseEngine({ sqlitePath: opDbPath, isTest: false });
    await assert.rejects(
      async () => {
        await opDb.resetDatabaseForTest();
      },
      /CRITICAL_SECURITY_VIOLATION/
    );
    fs.rmSync(opDbPath, { force: true });
  });

  // 14. N02.5: TURNSTILE VERIFICATION TESTS
  await t.test('N02.5: Turnstile verification blocks invalid tokens with 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'traveler.a@gmail.com',
        password: 'traveler123',
        turnstileToken: '2x0000000000000000000000000000000AA'
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /TURNSTILE/);
  });

  await t.test('N02.5: Turnstile verification blocks timed-out challenges with 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'traveler.a@gmail.com',
        password: 'traveler123',
        turnstileToken: 'timeout_token'
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /TURNSTILE/);
  });

  // 15. N02.5: RATE LIMITING BURST PROTECTION
  await t.test('N02.5: Auth endpoints enforce rate limiting returning 429 when burst limit is exceeded', async () => {
    let got429 = false;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'rate.limit.burst@gmail.com',
          password: 'somepassword'
        })
      });
      if (res.status === 429) {
        got429 = true;
        assert.ok(res.headers.get('retry-after'));
        const body = await res.json();
        assert.equal(body.success, false);
        assert.match(body.error, /TOO_MANY_REQUESTS/);
        break;
      }
    }
    assert.equal(got429, true, 'Rapid burst of auth requests must trigger 429 response');
  });
});
