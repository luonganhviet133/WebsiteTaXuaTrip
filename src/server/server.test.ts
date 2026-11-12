import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createExpressApp } from '../../server.ts';
import { DatabaseEngine } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Express Server API Endpoints & Safety Guards (Part A: F1, F2, F3 Verification)', async (t) => {
  const testDb = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
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
  });

  // F3 Verification: Valid route returns 200 JSON
  await t.test('GET /api/health returns 200 with structured JSON', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.hasGeminiKey, 'boolean');
    assert.equal(typeof body.hasRevidKey, 'boolean');
    assert.ok(body.timestamp);
  });

  // F3 Verification: Bare /api, /api/ and missing subroutes across GET and POST must all return 404 JSON
  await t.test('GET /api returns 404 JSON (NOT 200 HTML fallback)', async () => {
    const res = await fetch(`${baseUrl}/api`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = await res.json();
    assert.equal(body.error, 'API endpoint not found');
    assert.equal(body.path, '/api');
    assert.ok(body.timestamp);
  });

  await t.test('POST /api returns 404 JSON (NOT HTML 404)', async () => {
    const res = await fetch(`${baseUrl}/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true })
    });
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = await res.json();
    assert.equal(body.error, 'API endpoint not found');
  });

  await t.test('GET /api/ returns 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = await res.json();
    assert.equal(body.error, 'API endpoint not found');
  });

  await t.test('GET /api/missing returns 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/missing`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = await res.json();
    assert.equal(body.error, 'API endpoint not found');
    assert.equal(body.path, '/api/missing');
  });

  await t.test('POST /api/missing returns 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/missing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dummy: 123 })
    });
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = await res.json();
    assert.equal(body.error, 'API endpoint not found');
  });

  // F2 Verification: Frontend production serving from source factory
  await t.test('GET / in production returns built HTML, NOT source index.html containing /src/main.tsx', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const html = await res.text();
    assert.ok(html.includes('Tà Xùa Trip') || html.includes('<!doctype html>'));
    assert.equal(html.includes('/src/main.tsx'), false, 'Built HTML must NOT contain unbundled /src/main.tsx');
    assert.equal(html.includes('/@vite/client'), false, 'Built HTML must NOT contain /@vite/client');
  });

  await t.test('GET /taxua-trip/ in production returns built HTML for subpath', async () => {
    const res = await fetch(`${baseUrl}/taxua-trip/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const html = await res.text();
    assert.equal(html.includes('/src/main.tsx'), false);
  });

  await t.test('GET asset files returns application/javascript or text/css, NOT HTML fallback', async () => {
    const clientAssetsDir = path.resolve(projectRoot, 'dist/client/assets');
    if (fs.existsSync(clientAssetsDir)) {
      const files = fs.readdirSync(clientAssetsDir);
      const jsFile = files.find((f) => f.endsWith('.js'));
      const cssFile = files.find((f) => f.endsWith('.css'));

      if (jsFile) {
        const res = await fetch(`${baseUrl}/taxua-trip/assets/${jsFile}`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') || '', /javascript/);
      }
      if (cssFile) {
        const res = await fetch(`${baseUrl}/taxua-trip/assets/${cssFile}`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') || '', /css/);
      }
    }
  });

  await t.test('Non-existent asset returns 404 instead of SPA HTML fallback', async () => {
    const res = await fetch(`${baseUrl}/taxua-trip/assets/non-existent-test-asset.js`);
    assert.equal(res.status, 404);
    assert.doesNotMatch(res.headers.get('content-type') || '', /text\/html/);
  });

  await t.test('GET /server.ts does NOT expose server source code', async () => {
    const res = await fetch(`${baseUrl}/server.ts`);
    assert.equal(res.status, 404);
    const body = await res.text();
    assert.doesNotMatch(body, /createExpressApp/);
  });

  await t.test('GET /server.js does NOT expose server bundle file', async () => {
    const res = await fetch(`${baseUrl}/server.js`);
    assert.equal(res.status, 404);
    const body = await res.text();
    assert.doesNotMatch(body, /packages=external/);
  });

  // Business endpoints
  await t.test('POST /api/revid/classify classifies task complexity', async () => {
    const res = await fetch(`${baseUrl}/api/revid/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Lên lịch trình 3 ngày 2 đêm săn mây Tà Xùa' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.equal(body.data.level, 'L3_reasoning');
    assert.ok(body.data.recommendedModelId);
  });

  await t.test('POST /api/ai/quick-quote generates valid quote', async () => {
    const res = await fetch(`${baseUrl}/api/ai/quick-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkIn: '2026-11-20',
        checkOut: '2026-11-22',
        guests: 2,
        budget: 2500000,
        pickupLocation: 'Hà Nội'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.summary);
    assert.equal(body.data.stayDurationNights, 2);
  });
});

import net from 'net';

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

test('F1 Verification: Real Subprocess execution of dist/server.js with NODE_ENV unset', async () => {
  const serverJsPath = path.resolve(projectRoot, 'dist/server.js');
  assert.ok(fs.existsSync(serverJsPath), 'dist/server.js must exist before running subprocess test');

  const testPort = await getAvailablePort();
  const childEnv = { ...process.env };
  delete childEnv.NODE_ENV; // Explicitly ensure NODE_ENV is unset!
  childEnv.PORT = String(testPort);

  let serverOutput = '';
  const child = spawn(process.execPath, [serverJsPath], {
    cwd: projectRoot,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (d) => {
    serverOutput += d.toString();
  });
  child.stderr.on('data', (d) => {
    serverOutput += d.toString();
  });

  try {
    // Wait for server to bind port
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (serverOutput.includes(`:${testPort}`)) {
        ready = true;
        break;
      }
    }
    assert.ok(ready, `Server failed to start in time. Output: ${serverOutput}`);

    // Verify it defaulted to production!
    assert.match(serverOutput, /Env: production/, 'Server bundle without NODE_ENV must default to production mode');

    const baseUrl = `http://127.0.0.1:${testPort}`;

    // Verify root HTML is production built asset, no Vite client
    const resRoot = await fetch(`${baseUrl}/`);
    assert.equal(resRoot.status, 200);
    const rootHtml = await resRoot.text();
    assert.equal(rootHtml.includes('/@vite/client'), false, 'Subprocess HTML must not have Vite client');
    assert.equal(rootHtml.includes('/src/main.tsx'), false, 'Subprocess HTML must not have unbundled source');

    // Verify /sw.js does NOT serve development unregister script
    const resSw = await fetch(`${baseUrl}/sw.js`);
    const swContent = await resSw.text();
    assert.equal(swContent.includes('self.registration.unregister()'), false, 'Production must not serve dev unregister SW');

    // Verify health JSON works
    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert.equal(resHealth.status, 200);
    const healthBody = await resHealth.json();
    assert.equal(healthBody.status, 'ok');

    // Verify API fallback 404 works on bare /api
    const resApi = await fetch(`${baseUrl}/api`);
    assert.equal(resApi.status, 404);
    assert.match(resApi.headers.get('content-type') || '', /application\/json/);
  } finally {
    child.kill('SIGTERM');
  }
});
