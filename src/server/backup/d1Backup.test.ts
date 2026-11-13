import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseEngine } from '../db.ts';
import { D1Backup, BACKUP_ROOT, KEEP_RUNS, ROWS_PER_STEP, type BackupBucket } from './d1Backup.ts';
import { backupToSql } from './restore.ts';

class FakeBucket implements BackupBucket {
  objects = new Map<string, string>();
  async put(key: string, value: string) { this.objects.set(key, value); }
  async get(key: string) { const v = this.objects.get(key); return v === undefined ? null : { text: async () => v }; }
  async delete(keys: string | string[]) { for (const k of [keys].flat()) this.objects.delete(k); }
  async list({ prefix, delimiter }: { prefix: string; delimiter?: string }) {
    const keys = [...this.objects.keys()].filter((k) => k.startsWith(prefix)).sort();
    if (!delimiter) return { objects: keys.map((key) => ({ key })), truncated: false };
    const prefixes = new Set<string>(); const objects: { key: string }[] = [];
    for (const k of keys) { const rest = k.slice(prefix.length); const i = rest.indexOf(delimiter); if (i >= 0) prefixes.add(prefix + rest.slice(0, i + 1)); else objects.push({ key: k }); }
    return { objects, delimitedPrefixes: [...prefixes], truncated: false };
  }
}

async function source() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  // Dữ liệu khó: dấu nháy, tiếng Việt, xuống dòng, NULL, số thực, và nhiều dòng để phải chia nhiều bước/tệp.
  await db.d1.prepare("INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES ('au_q', NULL, 'admin', 'x', 'profile', 'p', ?, '2026-11-13T00:00:00.000Z')")
    .bind(`{"reason":"Khách nói 'đẹp' \\"quá\\"\\nxuống dòng"}`).run();
  const stmts = [];
  for (let i = 0; i < 2100; i++) stmts.push(db.d1.prepare("INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, 'a', 'admin', 'bulk', 'profile', 'p', '{}', '2026-11-13T00:00:00.000Z')").bind(`au_${i}`));
  await db.d1.batch(stmts);
  return db;
}

async function tableCounts(query: (sql: string) => Promise<any[]>) {
  const names = (await query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
  const out: Record<string, number> = {};
  for (const n of names) out[n] = (await query(`SELECT COUNT(*) AS n FROM "${n}"`))[0].n;
  return out;
}

test('Sao lưu chia bước, không cần token; khôi phục vào cơ sở dữ liệu trống ra đúng từng bảng, từng giá trị', async () => {
  const db = await source();
  const bucket = new FakeBucket();
  const backup = new D1Backup(db.d1, bucket);
  assert.equal(await backup.step(), 'idle', 'chưa bắt đầu thì không làm gì');
  const t0 = new Date('2026-11-15T20:17:00Z');
  const s = await backup.start('weekly', t0);
  assert.equal(s.started, true);
  assert.equal((await backup.start('manual', t0)).started, false, 'đang chạy thì không mở bản thứ hai');

  let steps = 0, r: string;
  do { r = await backup.step(new Date(t0.getTime() + steps * 300_000)); steps++; } while (r === 'progress' && steps < 50);
  assert.equal(r, 'done');
  assert.ok(steps >= 2, `phải chia nhiều bước (mỗi bước ≤ ${ROWS_PER_STEP} dòng), thực tế ${steps}`);

  const st = await backup.status();
  assert.equal(st.running, null);
  assert.equal(st.latest?.runId, s.runId);
  assert.ok(st.latest!.tables.audit_log >= 2101);

  const prefix = `${BACKUP_ROOT}${s.runId}/`;
  const sql = backupToSql((rel) => bucket.objects.get(prefix + rel)!);
  const restored = new DatabaseSync(':memory:');
  restored.exec(sql);

  const srcCounts = await tableCounts(async (q) => (await db.d1.prepare(q).all<any>()).results);
  const dstCounts = await tableCounts(async (q) => restored.prepare(q).all() as any[]);
  assert.deepEqual(dstCounts, srcCounts);
  const tricky = restored.prepare("SELECT detail_json, actor_id FROM audit_log WHERE id = 'au_q'").get() as any;
  assert.equal(tricky.detail_json, `{"reason":"Khách nói 'đẹp' \\"quá\\"\\nxuống dòng"}`);
  assert.equal(tricky.actor_id, null);
  const prof = await db.d1.prepare("SELECT * FROM profiles WHERE email = 'admin@taxuatrip.vn'").first<any>();
  assert.deepEqual({ ...(restored.prepare("SELECT * FROM profiles WHERE email = 'admin@taxuatrip.vn'").get() as any) }, { ...prof }, 'từng cột của tài khoản khớp');
});

test('Giữ tối đa KEEP_RUNS bản, xóa bản cũ nhất; bản chạy dở quá 6 giờ thì được thay', async () => {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const bucket = new FakeBucket();
  const backup = new D1Backup(db.d1, bucket);
  const runs: string[] = [];
  for (let i = 0; i < KEEP_RUNS + 2; i++) {
    const t = new Date(Date.UTC(2026, 0, 1 + i * 7, 20, 17));
    runs.push((await backup.start('weekly', t)).runId);
    while ((await backup.step(t)) === 'progress');
  }
  const left = new Set([...bucket.objects.keys()].map((k) => k.slice(BACKUP_ROOT.length).split('/')[0]).filter((x) => /^\d{4}-/.test(x)));
  assert.equal(left.size, KEEP_RUNS);
  assert.ok(!left.has(runs[0]) && !left.has(runs[1]), 'hai bản cũ nhất đã xóa');
  assert.ok(left.has(runs[runs.length - 1]));

  const t1 = new Date('2026-06-01T00:00:00Z');
  const a = await backup.start('weekly', t1);
  assert.equal((await backup.start('manual', new Date(t1.getTime() + 3600_000))).started, false);
  const b = await backup.start('manual', new Date(t1.getTime() + 7 * 3600_000));
  assert.equal(b.started, true, 'bản treo quá 6 giờ thì bắt đầu lại');
  assert.notEqual(a.runId, b.runId);
});

test('API sao lưu: chỉ admin; không có bucket thì báo chưa cấu hình; bấm "Sao lưu ngay" chạy bước đầu và báo tình trạng', async () => {
  const { handleApiRequest } = await import('../api.ts');
  const { TURNSTILE_TEST_SECRET } = await import('../antiAbuse.ts');
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const bucket = new FakeBucket();
  const mk = (withBucket: boolean) => ({ db, clientIp: '10.9.9.9', revidBaseUrl: '', revidApiKey: '', runtime: 'node' as const, turnstileSecret: TURNSTILE_TEST_SECRET, ...(withBucket ? { backupBucket: bucket } : {}) });
  const call = async (ctx: any, method: string, path: string, token?: string, body?: unknown) => {
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  const login = async (identifier: string, password: string) => (await call(mk(true), 'POST', '/api/auth/login', undefined, { identifier, password, turnstileToken: '1x0000000000000000000000000000000AA' })).body.token;
  const admin = await login('admin@taxuatrip.vn', 'admin123');
  const traveler = await login('traveler.a@gmail.com', 'traveler123');
  assert.equal((await call(mk(true), 'GET', '/api/admin/backups', traveler)).status, 403);
  assert.equal((await call(mk(false), 'GET', '/api/admin/backups', admin)).body.code, 'BACKUP_NOT_CONFIGURED');
  assert.deepEqual((await call(mk(true), 'GET', '/api/admin/backups', admin)).body.data, { latest: null, running: null });
  const run = await call(mk(true), 'POST', '/api/admin/backups/run', admin);
  assert.equal(run.status, 200, JSON.stringify(run.body));
  assert.equal(run.body.data.state, 'done', 'dữ liệu nhỏ thì xong ngay trong một bước');
  assert.ok(run.body.data.latest.totalRows > 0);
  assert.ok(run.body.data.latest.reason.startsWith('manual:'));
  assert.ok(![...bucket.objects.keys()].some((k) => !k.startsWith('backups/d1/')), 'chỉ ghi dưới backups/d1/');
});
