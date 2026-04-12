/**
 * Rate Limiting Middleware for SecuClaw
 * Prevents brute force attacks and API abuse
 */
import type { IncomingMessage } from 'http';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const DEFAULT_OPTIONS = {
  windowMs: 60_000,       // 1 minute window
  maxRequests: 100,       // 100 requests per window
  blockDurationMs: 300_000, // 5 minute block
};

export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private blockDurationMs: number;

  constructor(options: Partial<typeof DEFAULT_OPTIONS> = {}) {
    this.windowMs = options.windowMs ?? DEFAULT_OPTIONS.windowMs;
    this.maxRequests = options.maxRequests ?? DEFAULT_OPTIONS.maxRequests;
    this.blockDurationMs = options.blockDurationMs ?? DEFAULT_OPTIONS.blockDurationMs;
  }

  check(identifier: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.entries.get(identifier);

    // No entry exists — allow and create
    if (!entry) {
      this.entries.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    // Entry is blocked (in cooldown)
    if (now < entry.resetTime - this.windowMs + this.blockDurationMs && entry.count >= this.maxRequests) {
      const retryAfterMs = entry.resetTime - now + this.blockDurationMs;
      return { allowed: false, retryAfterMs };
    }

    // Window expired — reset
    if (now >= entry.resetTime) {
      this.entries.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    // Within window — increment count
    entry.count++;
    if (entry.count > this.maxRequests) {
      // Exceeded — apply block
      entry.resetTime = now;
      const retryAfterMs = this.blockDurationMs;
      return { allowed: false, retryAfterMs };
    }

    return { allowed: true, retryAfterMs: 0 };
  }

  reset(identifier: string): void {
    this.entries.delete(identifier);
  }

  getStatus(identifier: string): { remaining: number; isBlocked: boolean } {
    const entry = this.entries.get(identifier);
    if (!entry) return { remaining: this.maxRequests, isBlocked: false };
    const now = Date.now();
    if (now >= entry.resetTime) return { remaining: this.maxRequests, isBlocked: false };
    return { remaining: Math.max(0, this.maxRequests - entry.count), isBlocked: entry.count >= this.maxRequests };
  }
}

// Singleton instances for different rate limit tiers
export const apiRateLimiter = new RateLimiter({
  windowMs: 60_000,      // 1 minute
  maxRequests: 100,      // 100 req/min for general API
  blockDurationMs: 300_000, // 5 min block
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,            // 5 login attempts per 15 min
  blockDurationMs: 30 * 60 * 1000, // 30 min block
});

export const wsRateLimiter = new RateLimiter({
  windowMs: 10_000,      // 10 seconds
  maxRequests: 50,       // 50 messages per 10s
  blockDurationMs: 60_000,  // 1 min block
});

// Default rate limiter with Express-compatible middleware
export const rateLimiter = {
  middleware: (options?: Partial<typeof DEFAULT_OPTIONS>) => {
    const limiter = new RateLimiter(options ?? {});
    return (req: any, res: any, next: any) => {
      const identifier = req.ip || req.connection?.remoteAddress || 'unknown';
      const { allowed, retryAfterMs } = limiter.check(identifier);
      if (!allowed) {
        res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
        res.status(429).json({
          error: 'Too many requests', 
          retryAfter: Math.ceil(retryAfterMs / 1000) + 's',
        });
        return;
      }
      next();
    };
  }
};
