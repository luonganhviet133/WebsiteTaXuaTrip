/**
 * Smoke test: khởi động Worker thật trong workerd (Miniflare) và gọi /api/health.
 *
 * Bắt lỗi chỉ xuất hiện trên Cloudflare: code chạy ở cấp module dùng API riêng của Node
 * (import.meta.url, node:sqlite) làm Worker sập ngay lúc khởi động. `wrangler deploy --dry-run`
 * không chạy code nên không phát hiện được lỗi này.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unstable_dev } from 'wrangler';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Dùng dist/client đã build sẵn (`npm run build` chạy trước `npm test`), không build lại khi khởi động Worker:
// build lại sẽ xóa dist/client trong lúc các file test khác đang phục vụ thư mục này.
process.env.SKIP_CLIENT_BUILD = '1';
if (!fs.existsSync(path.join(projectRoot, 'dist/client/index.html'))) {
  throw new Error('Thiếu dist/client: chạy `npm run build` trước khi chạy test Worker.');
}

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

    // U2: tải lại / mở link chia sẻ ở đường dẫn của từng màn phải trả về trang (index.html).
    for (const route of ['/co-so/tx-stay-5', '/luu-tru', '/chuyen-di-cua-toi', '/quan-tri']) {
      const page = await worker.fetch(route, { headers: { Accept: 'text/html' } });
      assert.equal(page.status, 200, `${route} trả ${page.status}`);
      assert.match(await page.text(), /<div id="root">/, `${route} không trả index.html`);
    }

    // G0.3: production (NODE_ENV=production trong wrangler.toml) chưa có TURNSTILE_SECRET_KEY
    // thì đăng ký/đăng nhập phải bị chặn, kể cả khi gửi token test công khai của Cloudflare.
    for (const route of ['/api/auth/register', '/api/auth/login']) {
      const res = await worker.fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'bot@example.com',
          email: 'bot@example.com',
          password: 'Matkhau123!',
          fullName: 'Bot',
          role: 'traveler',
          turnstileToken: '1x0000000000000000000000000000000AA'
        })
      });
      assert.equal(res.status, 503, `${route} trả ${res.status}`);
      const body = (await res.json()) as { error?: string };
      assert.equal(body.error, 'TURNSTILE_NOT_CONFIGURED');
    }
  } finally {
    await worker.stop();
  }
});
