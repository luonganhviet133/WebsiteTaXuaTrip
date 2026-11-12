/**
 * G0.3 — Kiểm tra Turnstile phía server.
 * Gọi Siteverify được giả lập bằng cách thay globalThis.fetch, không gọi Cloudflare thật.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstileToken, TURNSTILE_TEST_SECRET } from './antiAbuse.ts';

const REAL_SECRET = '0x4AAAAAAA-real-secret-for-test';
const PUBLIC_TEST_TOKEN = '1x0000000000000000000000000000000AA';

type SiteverifyReply = Record<string, unknown>;

async function withSiteverify<T>(reply: SiteverifyReply, run: (calls: string[]) => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: any, init?: any) => {
    calls.push(String(init?.body ?? ''));
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = original;
  }
}

test('Secret thật: token test công khai 1x…AA không được vượt qua, phải hỏi Siteverify', async () => {
  await withSiteverify({ success: false, 'error-codes': ['invalid-input-response'] }, async (calls) => {
    const result = await verifyTurnstileToken(PUBLIC_TEST_TOKEN, '1.2.3.4', 'login', undefined, REAL_SECRET);
    assert.equal(result.success, false);
    assert.equal(calls.length, 1, 'phải gọi Siteverify đúng 1 lần');
  });
});

test('Không có secret: từ chối với TURNSTILE_NOT_CONFIGURED, không gọi mạng', async () => {
  await withSiteverify({ success: true }, async (calls) => {
    const result = await verifyTurnstileToken('any-token', '1.2.3.4', 'login', undefined, undefined);
    assert.equal(result.success, false);
    assert.equal(result.error, 'TURNSTILE_NOT_CONFIGURED');
    assert.equal(calls.length, 0);
  });
});

test('Secret thật nhưng thiếu token: từ chối, không gọi mạng', async () => {
  await withSiteverify({ success: true }, async (calls) => {
    const result = await verifyTurnstileToken(undefined, '1.2.3.4', 'login', undefined, REAL_SECRET);
    assert.equal(result.success, false);
    assert.equal(result.error, 'MISSING_TURNSTILE_TOKEN');
    assert.equal(calls.length, 0);
  });
});

test('Secret thật: Siteverify đạt nhưng sai hostname thì từ chối', async () => {
  await withSiteverify({ success: true, action: 'login', hostname: 'evil.example' }, async () => {
    const result = await verifyTurnstileToken('tok', '1.2.3.4', 'login', ['websitetaxuatrip.vanhuy171099.workers.dev'], REAL_SECRET);
    assert.equal(result.success, false);
    assert.equal(result.error, 'TURNSTILE_HOSTNAME_MISMATCH');
  });
});

test('Secret thật: Siteverify đạt, đúng action và hostname thì cho qua', async () => {
  const host = 'websitetaxuatrip.vanhuy171099.workers.dev';
  await withSiteverify({ success: true, action: 'register', hostname: host, challenge_ts: '2026-11-12T10:00:00Z' }, async (calls) => {
    const result = await verifyTurnstileToken('tok', '1.2.3.4', 'register', [host], REAL_SECRET);
    assert.equal(result.success, true);
    assert.match(calls[0], new RegExp(`secret=${encodeURIComponent(REAL_SECRET)}`));
  });
});

test('Secret test của Cloudflare: giữ chế độ giả lập cho dev/test (2x…AA bị từ chối)', async () => {
  const fail = await verifyTurnstileToken('2x0000000000000000000000000000000AA', '1.2.3.4', 'login', undefined, TURNSTILE_TEST_SECRET);
  assert.equal(fail.success, false);
  const pass = await verifyTurnstileToken('dev-token', '1.2.3.4', 'login', undefined, TURNSTILE_TEST_SECRET);
  assert.equal(pass.success, true);
});
