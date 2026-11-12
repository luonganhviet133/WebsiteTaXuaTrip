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

    // Trang chủ phải trỏ tới JS/CSS mà Worker thật sự phục vụ (không 404 do sai base path).
    const home = await worker.fetch('/');
    assert.equal(home.status, 200);
    const html = await home.text();
    const assetPaths = [...html.matchAll(/(?:src|href)="(\/(?:[^"]*\/)?assets\/index-[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
    assert.ok(assetPaths.length >= 2, `Không tìm thấy JS/CSS chính trong index.html: ${assetPaths.join(', ')}`);
    for (const assetPath of assetPaths) {
      const asset = await worker.fetch(assetPath);
      assert.equal(asset.status, 200, `${assetPath} trả ${asset.status}`);
      await asset.arrayBuffer();
    }
  } finally {
    await worker.stop();
  }
});
