import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Readable } from 'node:stream';
import { getDefaultDb, DatabaseEngine } from './src/server/db.ts';
import { TURNSTILE_TEST_SECRET, getClientIp } from './src/server/antiAbuse.ts';
import { handleApiRequest } from './src/server/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateAppOptions {
  isProd?: boolean;
  skipVite?: boolean;
  clientDistDir?: string;
  db?: DatabaseEngine;
}

export function resolveClientDistDir(customDir?: string): string {
  if (customDir) return path.resolve(customDir);
  // 1. If running bundled server (dist/server.js), client build is at ./client
  const inSubClient = path.resolve(__dirname, 'client');
  if (fs.existsSync(path.resolve(inSubClient, 'index.html'))) {
    return inSubClient;
  }
  // 2. If running from source (server.ts), client build is at ./dist/client
  const inDistClient = path.resolve(__dirname, 'dist', 'client');
  if (fs.existsSync(path.resolve(inDistClient, 'index.html'))) {
    return inDistClient;
  }
  // 3. Fallback if dist was flat without subfolder, but NEVER allow project source root
  const inDist = path.basename(__dirname) === 'dist' ? __dirname : path.resolve(__dirname, 'dist');
  if (fs.existsSync(path.resolve(inDist, 'index.html')) && !fs.existsSync(path.resolve(inDist, 'server.ts'))) {
    return inDist;
  }
  return inDistClient;
}

export async function createExpressApp(options: CreateAppOptions = {}): Promise<express.Express> {
  const app = express();
  const isServerBundle = path.basename(__dirname) === 'dist' || __filename.includes('dist');
  const defaultIsProd = process.env.NODE_ENV === 'production' || isServerBundle;
  const isProd = options.isProd !== undefined ? options.isProd : defaultIsProd;
  const port = process.env.PORT || 3000;

  const databaseInstance = options.db || getDefaultDb();

  // STRICT R2 & S4: Verify database health on startup
  const dbHealth = await databaseInstance.checkHealth();
  if (!dbHealth.databaseOk) {
    const errorMsg = `[Database] D1 check failure: ${dbHealth.error || 'Unknown error'}`;
    if (isProd) {
      console.error(`[FATAL] ${errorMsg}`);
      throw new Error(errorMsg);
    } else {
      console.warn(`[Database] Warning: ${errorMsg}`);
    }
  }

  // Toàn bộ /api đi qua bộ xử lý chung với Worker (src/server/api.ts). Express chỉ chuyển đổi
  // request/response; không đọc body trước để bộ xử lý tự đọc như trên Worker.
  app.all(['/api', '/api/*'], async (req, res) => {
    try {
      const url = `${req.protocol}://${req.get('host') || 'localhost'}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const request = new Request(url, {
        method: req.method,
        headers,
        body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
        duplex: hasBody ? 'half' : undefined
      } as RequestInit);

      const response = await handleApiRequest(request, {
        db: databaseInstance,
        clientIp: getClientIp(req),
        turnstileSecret: process.env.TURNSTILE_SECRET_KEY || TURNSTILE_TEST_SECRET,
        geminiApiKey: process.env.GEMINI_API_KEY,
        revidBaseUrl: process.env.REVID_BASE_URL || 'https://ai.revidapi.com/v1',
        revidApiKey: process.env.REVID_API_KEY || '',
        runtime: 'node'
      });

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch (err: any) {
      console.error('[API adapter] Error:', err);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  });

  if (!isProd) {
    // In dev mode, force-clear any stale PWA Service Worker & CacheStorage from earlier sessions
    app.get(['/sw.js', '/taxua-trip/sw.js'], (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.send(`
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', (event) => {
          event.waitUntil(
            caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
              .then(() => self.registration.unregister())
              .then(() => self.clients.matchAll())
              .then((clients) => clients.forEach((client) => client.navigate(client.url)))
          );
        });
      `);
    });

    // Development mode with Vite Middleware (skip if running in unit/integration test)
    if (!options.skipVite && process.env.NODE_ENV !== 'test') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: '0.0.0.0',
          port: Number(port)
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  } else {
    // Production mode: serve static files ONLY from clientDistDir
    const clientDistDir = resolveClientDistDir(options.clientDistDir);
    const indexPath = path.resolve(clientDistDir, 'index.html');

    // Static assets for subpath and root
    app.use('/taxua-trip', express.static(clientDistDir));
    app.use(express.static(clientDistDir));

    // Non-existent assets under assets/ return 404 instead of SPA HTML fallback
    app.all(['/assets/*', '/taxua-trip/assets/*'], (req, res) => {
      res.status(404).type('text/plain').send('Asset not found');
    });

    // Explicitly protect server source and bundle from being downloaded
    app.all(['/server.ts', '/server.js', '/taxua-trip/server.ts', '/taxua-trip/server.js'], (req, res) => {
      res.status(404).type('text/plain').send('Not Found');
    });

    // SPA fallback: only for GET requests
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).type('text/plain').send('Not Found');
      }
    });
  }

  return app;
}

export async function startServer(port = Number(process.env.PORT || 3000), options: CreateAppOptions = {}) {
  const isServerBundle = path.basename(__dirname) === 'dist' || __filename.includes('dist');
  const defaultIsProd = process.env.NODE_ENV === 'production' || isServerBundle;
  const isProd = options.isProd !== undefined ? options.isProd : defaultIsProd;
  const app = await createExpressApp({ isProd, ...options });
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[Tà Xùa Trip Server] Server listening on http://0.0.0.0:${port} (Env: ${isProd ? 'production' : 'development'})`);
  });
  return server;
}

// Auto-run if executed directly as script entry point
const isMainModule = () => {
  if (process.argv[1]) {
    try {
      const currentFilePath = fileURLToPath(import.meta.url);
      const executedFilePath = path.resolve(process.argv[1]);
      return currentFilePath === executedFilePath;
    } catch {
      return false;
    }
  }
  return false;
};

if (isMainModule()) {
  startServer().catch((err) => {
    console.error('[Tà Xùa Trip Server] Startup failure:', err);
    process.exit(1);
  });
}
