/**
 * Smoke test: khởi động Worker thật trong workerd (Miniflare) và gọi /api/health.
 *
 * Bắt lỗi chỉ xuất hiện trên Cloudflare: code chạy ở cấp module dùng API riêng của Node
 * (import.meta.url, node:sqlite) làm Worker sập ngay lúc khởi động. `wrangler deploy --dry-run`
 * không chạy code nên không phát hiện được lỗi này.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unstable_dev } from 'wrangler';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Worker khởi động được trong workerd và /api/health trả JSON', { timeout: 120_000 }, async () => {
  const worker = await unstable_dev(path.join(projectRoot, 'src/worker.ts'), {
    config: path.join(projectRoot, 'wrangler.toml'),
    local: true,
    logLevel: 'error',
    experimental: { disableExperimentalWarning: true }
  });
  try {
    const res = await worker.fetch('/api/health');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = (await res.json()) as { status?: string; runtime?: string };
    assert.equal(body.status, 'ok');
    assert.equal(body.runtime, 'workerd');
  } finally {
    await worker.stop();
  }
});
