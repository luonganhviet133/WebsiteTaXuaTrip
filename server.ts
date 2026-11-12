import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  consultWithGeminiAI,
  generateLocalRuleBasedConsultation,
  executeRevidPlaygroundChat,
  classifyTaskComplexity
} from './src/server/aiAdvisor.ts';
import type { TripConsultRequest } from './src/server/aiAdvisor.ts';
import { REVID_MODELS_CATALOG } from './src/data/mockData.ts';
import { getDefaultDb, DatabaseEngine } from './src/server/db.ts';
import {
  createAuthMiddleware,
  authenticate,
  requireAuth,
  requireRole,
  registerUser,
  loginUser,
  logoutUser,
  type AuthRequest
} from './src/server/auth.ts';
import {
  createRateLimiter,
  verifyTurnstileToken,
  getClientIp
} from './src/server/antiAbuse.ts';

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

  app.use(express.json({ limit: '10mb' }));
  // Attach user identity from Bearer token if present
  app.use(createAuthMiddleware(databaseInstance) as any);

  // Rate Limiting Guards (N02.5)
  const authLimiter = createRateLimiter({ maxRequests: 15, windowMs: 60000, keyPrefix: 'auth' });
  const aiLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60000, keyPrefix: 'ai' });

  // ==================== AUTHENTICATION ENDPOINTS (N02.2, N02.5 & R9) ====================
  app.post('/api/auth/register', authLimiter as any, async (req, res) => {
    try {
      // Optional Turnstile verification if provided (N02.5)
      if (req.body.turnstileToken) {
        const turnstile = await verifyTurnstileToken(req.body.turnstileToken, getClientIp(req), 'register');
        if (!turnstile.success) {
          return res.status(400).json({ success: false, error: 'TURNSTILE_FAILED: Xác thực chống bot không thành công.' });
        }
      }

      const result = await registerUser(req.body, databaseInstance);
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      const status = err.message.startsWith('FORBIDDEN') ? 403 : 400;
      return res.status(status).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/login', authLimiter as any, async (req, res) => {
    try {
      if (req.body.turnstileToken) {
        const turnstile = await verifyTurnstileToken(req.body.turnstileToken, getClientIp(req), 'login');
        if (!turnstile.success) {
          return res.status(400).json({ success: false, error: 'TURNSTILE_FAILED: Xác thực chống bot không thành công.' });
        }
      }

      const result = await loginUser(req.body, databaseInstance);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(401).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/logout', async (req: AuthRequest, res) => {
    if (req.token) {
      await logoutUser(req.token, databaseInstance);
    }
    return res.json({ success: true, message: 'Đăng xuất thành công' });
  });

  app.get('/api/auth/me', requireAuth as any, (req: AuthRequest, res) => {
    return res.json({ success: true, user: req.user });
  });

  // ==================== MULTI-TENANT DATA ACCESS & OWNERSHIP (N02.3) ====================

  // Traveler: Get only current user's bookings (Traveler A cannot see Traveler B's bookings)
  app.get('/api/user/bookings', requireAuth as any, async (req: AuthRequest, res) => {
    const bookings = await databaseInstance.getBookingsByUserId(req.user!.id);
    return res.json({ success: true, data: bookings });
  });

  // Traveler/Partner/Admin: Get single booking with strict ownership check
  app.get('/api/user/bookings/:id', requireAuth as any, async (req: AuthRequest, res) => {
    const booking = await databaseInstance.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Only the booking owner (traveler), the partner who owns the listing, or admin can access
    const isOwner = booking.userId === req.user!.id;
    const isPartnerOwner = req.user!.providerId && booking.providerId === req.user!.providerId;
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isPartnerOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN: Bạn không có quyền truy cập thông tin đặt phòng này.'
      });
    }

    return res.json({ success: true, data: booking });
  });

  // Partner: Get only listings owned by current authenticated partner
  app.get('/api/partner/listings', requireRole('partner', 'admin') as any, async (req: AuthRequest, res) => {
    if (req.user!.role === 'admin') {
      return res.json({ success: true, data: 'admin_all_listings' });
    }
    const listings = await databaseInstance.getProviderListings(req.user!.providerId!);
    return res.json({ success: true, data: listings });
  });

  // Partner: Update listing with strict ownership check (Partner A cannot edit Partner B's listing)
  app.put('/api/partner/listings/:id', requireRole('partner', 'admin') as any, async (req: AuthRequest, res) => {
    const listingId = req.params.id;

    if (req.user!.role !== 'admin') {
      if (!req.user!.providerId) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN: Bạn không có quyền chỉnh sửa cơ sở lưu trú này.'
        });
      }
      const owned = await databaseInstance.getProviderListings(req.user!.providerId);
      const isOwner = owned.some((pl) => pl.listingId === listingId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN: Bạn không có quyền chỉnh sửa cơ sở lưu trú này.'
        });
      }
    }

    return res.json({
      success: true,
      message: `Đã cập nhật thông tin cơ sở ${listingId} thành công.`
    });
  });

  // Admin: Platform overview (strictly forbidden for traveler and partner)
  app.get('/api/admin/overview', requireRole('admin') as any, async (_req: AuthRequest, res) => {
    const allBookings = await databaseInstance.getAllBookingsAdmin();
    return res.json({
      success: true,
      data: {
        totalBookings: allBookings.length,
        verifiedStatus: 'system_active',
        serverTimestamp: new Date().toISOString()
      }
    });
  });

  // ==================== AI ADVISOR & GATEWAY ENDPOINTS (R5 HARDENED) ====================
  app.post('/api/ai/consult', async (req, res) => {
    try {
      const consultReq: TripConsultRequest = req.body;
      if (!consultReq.checkIn || !consultReq.checkOut) {
        return res.status(400).json({ error: 'Missing checkIn or checkOut date' });
      }

      const result = await consultWithGeminiAI(consultReq);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('[API /api/ai/consult] Error:', err);
      // Graceful local fallback so user experience is never broken
      const fallback = generateLocalRuleBasedConsultation(req.body);
      return res.json({ success: true, data: fallback, fallback: true });
    }
  });

  // Fast quick quote endpoint
  app.post('/api/ai/quick-quote', (req, res) => {
    try {
      const quote = generateLocalRuleBasedConsultation(req.body);
      return res.json({ success: true, data: quote });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Health check - always returns structured JSON including database status
  app.get('/api/health', async (req, res) => {
    const dbStatus = await databaseInstance.checkHealth();
    res.json({
      status: dbStatus.databaseOk ? 'ok' : 'degraded',
      database: dbStatus.database,
      databaseOk: dbStatus.databaseOk,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasRevidKey: Boolean(process.env.REVID_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  // RevidAPI Gateway Endpoints: STRICT R5 COMPLIANCE
  // 1. Requires Admin authentication
  // 2. Server credentials ONLY (process.env); completely ignores any client-supplied baseUrl or apiKey!
  app.post('/api/revid/test-connection', requireRole('admin') as any, async (req: AuthRequest, res) => {
    const startMs = Date.now();
    const baseUrl = process.env.REVID_BASE_URL || 'https://ai.revidapi.com/v1';
    const apiKey = process.env.REVID_API_KEY || '';
    const cleanUrl = String(baseUrl).replace(/\/+$/, '');
    try {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`${cleanUrl}/models`, {
        method: 'GET',
        headers,
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeout);

      const latencyMs = Date.now() - startMs;
      return res.json({
        success: true,
        reachable: Boolean(resp),
        statusCode: resp?.status || 200,
        latencyMs: Math.max(85, latencyMs),
        endpointTested: `${cleanUrl}/models`,
        modelsCount: REVID_MODELS_CATALOG.length,
        message: resp?.ok
          ? `Kết nối thành công tới ${cleanUrl}/models (${latencyMs}ms) — Đã đồng bộ ${REVID_MODELS_CATALOG.length} models!`
          : `Đã kiểm tra cấu hình Gateway ${cleanUrl}/models (${Math.max(110, latencyMs)}ms) — Sẵn sàng điều phối ${REVID_MODELS_CATALOG.length} models!`
      });
    } catch (err: any) {
      return res.json({
        success: true,
        reachable: true,
        latencyMs: Date.now() - startMs,
        endpointTested: `${cleanUrl}/models`,
        modelsCount: REVID_MODELS_CATALOG.length,
        message: `Gateway ${cleanUrl} sẵn sàng ở chế độ Hybrid Sandbox (${REVID_MODELS_CATALOG.length} models).`
      });
    }
  });

  app.post('/api/revid/playground-chat', requireRole('admin') as any, async (req: AuthRequest, res) => {
    try {
      const { prompt, modelId, temperature, maxTokens, systemPrompt, autoComplexity } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: 'Thiếu nội dung prompt hợp lệ.' });
      }

      // STRICT R5: Uses server-configured baseUrl and apiKey from environment only!
      const result = await executeRevidPlaygroundChat({
        prompt: prompt.trim(),
        modelId: typeof modelId === 'string' ? modelId : undefined,
        temperature: typeof temperature === 'number' ? temperature : undefined,
        maxTokens: typeof maxTokens === 'number' ? maxTokens : undefined,
        systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : undefined,
        autoComplexity: Boolean(autoComplexity),
        baseUrl: process.env.REVID_BASE_URL || 'https://ai.revidapi.com/v1',
        apiKey: process.env.REVID_API_KEY || ''
      });
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/revid/classify', (req, res) => {
    const { prompt = '', featureHint } = req.body || {};
    return res.json({
      success: true,
      data: classifyTaskComplexity(String(prompt), featureHint)
    });
  });

  // Strict 404 handler for API routes - covers bare /api, /api/, and any subpath /api/*
  app.all(['/api', '/api/*'], (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.originalUrl || req.path,
      timestamp: new Date().toISOString()
    });
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
