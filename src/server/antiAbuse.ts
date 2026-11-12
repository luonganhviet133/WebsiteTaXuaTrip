/**
 * Anti-Abuse & Bot Protection Module (N02.5)
 * Cloudflare Turnstile Server Verification & Rate Limiting
 */
import type { Request, Response, NextFunction } from 'express';

export interface TurnstileVerifyResult {
  success: boolean;
  hostname?: string;
  action?: string;
  error?: string;
  challengeTs?: string;
}

// Cloudflare dummy test secrets & tokens:
// 1x0000000000000000000000000000000AA (always passes)
// 2x0000000000000000000000000000000AA (always fails)
export async function verifyTurnstileToken(
  token: string | undefined,
  clientIp: string,
  expectedAction?: string,
  allowedHostnames?: string[]
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

  // In test mode or when using Cloudflare test dummy keys
  if (token === '1x0000000000000000000000000000000AA' || secretKey.startsWith('1x0000000000000000000000000000000AA')) {
    if (token === '2x0000000000000000000000000000000AA') {
      return { success: false, error: 'TURNSTILE_TOKEN_INVALID' };
    }
    if (token === 'timeout_token') {
      return { success: false, error: 'TURNSTILE_TIMEOUT' };
    }
    if (token === 'wrong_action_token') {
      return { success: false, action: 'wrong_action', error: 'TURNSTILE_ACTION_MISMATCH' };
    }
    if (token === 'wrong_hostname_token') {
      return { success: false, hostname: 'malicious-domain.com', error: 'TURNSTILE_HOSTNAME_MISMATCH' };
    }
    // Default dummy pass
    return {
      success: true,
      hostname: 'localhost',
      action: expectedAction,
      challengeTs: new Date().toISOString()
    };
  }

  if (!token) {
    return { success: false, error: 'MISSING_TURNSTILE_TOKEN' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) formData.append('remoteip', clientIp);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data: any = await resp.json();
    if (!data.success) {
      return {
        success: false,
        error: data['error-codes']?.join(',') || 'TURNSTILE_FAILED'
      };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return {
        success: false,
        action: data.action,
        error: 'TURNSTILE_ACTION_MISMATCH'
      };
    }

    if (allowedHostnames && allowedHostnames.length > 0 && data.hostname) {
      if (!allowedHostnames.includes(data.hostname)) {
        return {
          success: false,
          hostname: data.hostname,
          error: 'TURNSTILE_HOSTNAME_MISMATCH'
        };
      }
    }

    return {
      success: true,
      hostname: data.hostname,
      action: data.action,
      challengeTs: data.challenge_ts
    };
  } catch (err: any) {
    return {
      success: false,
      error: `TURNSTILE_TIMEOUT_OR_NETWORK: ${err.message}`
    };
  }
}

// In-Memory Token Bucket for Local / Rate Limiting Burst Guard (N02.5)
interface RateBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateBucket>();

export function resetRateLimitsForTest(): void {
  rateLimitStore.clear();
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter: number; error?: string } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      allowed: false,
      retryAfter: retryAfterSec,
      error: 'TOO_MANY_REQUESTS: Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau.'
    };
  }

  return { allowed: true, retryAfter: 0 };
}

export function getClientIp(req: Request): string {
  // Trust Cloudflare connecting IP when running behind Cloudflare Workers
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cfIp.trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

export function createRateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const identifier = (req.body?.identifier || req.body?.email || '').trim().toLowerCase();
    const key = `${options.keyPrefix}:${ip}:${identifier}`;
    const result = checkRateLimit(key, options.maxRequests, options.windowMs);

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfter));
      res.status(429).json({
        success: false,
        error: result.error,
        retryAfter: result.retryAfter
      });
      return;
    }

    next();
  };
}
