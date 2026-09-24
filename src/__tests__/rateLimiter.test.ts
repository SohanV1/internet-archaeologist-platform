import { RateLimiter, getClientIp } from '@/lib/security/rateLimiter';

describe('Security Rate Limiter (RateLimiter & getClientIp)', () => {
  it('allows requests within the configured threshold', () => {
    const limiter = new RateLimiter(5, 60);
    const ip = '198.51.100.1';

    for (let i = 1; i <= 5; i++) {
      const res = limiter.check(ip);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(5 - i);
      expect(res.limit).toBe(5);
    }
  });

  it('rejects requests once threshold is exhausted and returns retryAfter', () => {
    const limiter = new RateLimiter(3, 60);
    const ip = '198.51.100.2';

    // Exhaust quota
    limiter.check(ip);
    limiter.check(ip);
    limiter.check(ip);

    // 4th request should be blocked
    const blockedRes = limiter.check(ip);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.retryAfter).toBeGreaterThan(0);
  });

  it('tracks distinct IP addresses independently', () => {
    const limiter = new RateLimiter(2, 60);
    const ipA = '198.51.100.10';
    const ipB = '198.51.100.20';

    limiter.check(ipA);
    limiter.check(ipA);
    expect(limiter.check(ipA).allowed).toBe(false);

    // ipB should still be permitted
    expect(limiter.check(ipB).allowed).toBe(true);
  });

  it('correctly extracts client IP from x-forwarded-for or x-real-ip headers', () => {
    const headersA = new Headers({ 'x-forwarded-for': '203.0.113.195, 10.0.0.1' });
    expect(getClientIp(headersA)).toBe('203.0.113.195');

    const headersB = new Headers({ 'x-real-ip': '198.51.100.42' });
    expect(getClientIp(headersB)).toBe('198.51.100.42');

    const headersEmpty = new Headers();
    expect(getClientIp(headersEmpty)).toBe('127.0.0.1');
  });
});
