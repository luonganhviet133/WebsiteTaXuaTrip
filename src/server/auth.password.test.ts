import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine, hashPassword } from './db.ts';
import { handleApiRequest, type ApiContext } from './api.ts';

// Hotfix 13/11/2026: đổi mật khẩu từng gọi nhầm hàm bootstrap admin (đặt role = 'admin').
test('Đổi mật khẩu giữ nguyên vai trò (khách, đối tác) và thu hồi các phiên cũ', async () => {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = { db, clientIp: '10.0.0.1', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  for (const email of ['traveler.a@gmail.com', 'partner.a@taxuatrip.vn']) {
    const p = (await db.findProfileByEmail(email))!;
    await db.d1.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?').bind(hashPassword('MatKhauCu123'), p.id).run();
    const other = (await db.createSession(p.id, p.role)).token;
    const { token } = await db.createSession(p.id, p.role);
    const res = await handleApiRequest(
      new Request('http://local/api/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: 'MatKhauCu123', newPassword: 'MatKhauMoi456!' }),
      }),
      ctx
    );
    assert.equal(res.status, 200);
    const after = (await db.findProfileByEmail(email))!;
    assert.equal(after.role, p.role, `${email}: vai trò không đổi`);
    assert.equal(after.isVerified, p.isVerified, `${email}: trạng thái xác minh không đổi`);
    assert.equal(await db.findActiveSession(other), null, 'phiên cũ bị thu hồi');
  }
});
