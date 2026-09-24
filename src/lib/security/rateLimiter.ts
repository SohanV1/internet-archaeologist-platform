/**
 * In-Memory Sliding-Window Rate Limiter
 * Protects investigation endpoints from abusive high-frequency queries and DoS attacks.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // unix timestamp in seconds
  retryAfter: number; // seconds
}

export class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastCleanup: number = Date.now();

  constructor(maxRequests: number = 30, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Evaluates if a client key (e.g. IP address) is within allowable rate limits.
   */
  public check(clientKey: string): RateLimitResult {
    const now = Date.now();
    this.periodicCleanup(now);

    const record = this.requests.get(clientKey);

    if (!record || now >= record.resetAt) {
      const resetAt = now + this.windowMs;
      this.requests.set(clientKey, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        resetTime: Math.ceil(resetAt / 1000),
        retryAfter: 0,
      };
    }

    if (record.count >= this.maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime: Math.ceil(record.resetAt / 1000),
        retryAfter,
      };
    }

    record.count += 1;
    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      resetTime: Math.ceil(record.resetAt / 1000),
      retryAfter: 0,
    };
  }

  /**
   * Housekeeping to prevent memory growth over time
   */
  private periodicCleanup(now: number): void {
    if (now - this.lastCleanup > 60000) {
      for (const [key, record] of this.requests.entries()) {
        if (now >= record.resetAt) {
          this.requests.delete(key);
        }
      }
      this.lastCleanup = now;
    }
  }

  /**
   * Reset tracking for testing
   */
  public reset(): void {
    this.requests.clear();
  }
}

// Global singleton instance for investigation endpoints (30 req / 60s per client IP)
export const globalInvestigateRateLimiter = new RateLimiter(30, 60);

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  return '127.0.0.1';
}
