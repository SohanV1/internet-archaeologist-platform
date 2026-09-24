import { NextRequest, NextResponse } from 'next/server';
import { createInvestigation } from '@/lib/osint/investigationEngine';
import { validateAndSanitizeDomain } from '@/lib/osint/validator';
import { logger } from '@/lib/osint/logger';
import { globalInvestigateRateLimiter, getClientIp } from '@/lib/security/rateLimiter';
import { InvestigateRequestBody, InvestigateApiResponse } from '@/types/api';

export async function POST(req: NextRequest): Promise<NextResponse<InvestigateApiResponse>> {
  const startTime = performance.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Rate Limiting Enforcement (30 requests / 60s per client IP)
  const clientIp = getClientIp(req.headers);
  const rateLimit = globalInvestigateRateLimiter.check(clientIp);
  if (!rateLimit.allowed) {
    logger.warn('api:investigate', `Rate limit exceeded for client: ${clientIp}`, undefined, requestId);
    return NextResponse.json(
      { error: `Too many investigation requests. Please wait ${rateLimit.retryAfter} seconds before trying again.` },
      {
        status: 429,
        headers: {
          'X-Request-Id': requestId,
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }

  try {
    let body: Partial<InvestigateRequestBody>;
    try {
      body = await req.json();
    } catch {
      logger.warn('api:investigate', 'Malformed JSON payload received', undefined, requestId);
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        {
          status: 400,
          headers: { 'X-Request-Id': requestId },
        }
      );
    }

    const rawDomain = body.domain;
    if (!rawDomain || typeof rawDomain !== 'string' || !rawDomain.trim()) {
      return NextResponse.json(
        { error: 'Domain parameter is required and must be a valid non-empty string' },
        {
          status: 400,
          headers: { 'X-Request-Id': requestId },
        }
      );
    }

    // Strict validation & SSRF / non-routable defense
    const validation = validateAndSanitizeDomain(rawDomain);
    if (!validation.isValid || !validation.sanitizedDomain) {
      logger.warn(
        'api:investigate',
        `Validation blocked target: ${rawDomain}`,
        { error: validation.error, riskFlags: validation.riskFlags },
        requestId
      );
      return NextResponse.json(
        { error: validation.error || 'Invalid domain syntax' },
        {
          status: 400,
          headers: { 'X-Request-Id': requestId },
        }
      );
    }

    logger.info(
      'api:investigate',
      `Starting investigation for validated target: ${validation.sanitizedDomain}`,
      undefined,
      requestId
    );

    const investigation = await createInvestigation(validation.sanitizedDomain, body.authorization);
    const durationMs = Math.round(performance.now() - startTime);

    logger.info(
      'api:investigate',
      `Successfully processed investigation for: ${validation.sanitizedDomain}`,
      { durationMs },
      requestId
    );

    return NextResponse.json(investigation, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'Server-Timing': `investigation;dur=${durationMs}`,
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      },
    });
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? err.message : 'Investigation process failed';

    logger.error('api:investigate', `Unhandled API error: ${errorMessage}`, err, { durationMs }, requestId);

    const safeErrorMessage =
      process.env.NODE_ENV === 'production' && !errorMessage.includes('Invalid') && !errorMessage.includes('Access denied') && !errorMessage.includes('Domain')
        ? 'An unexpected error occurred during investigation. Please verify the target domain and try again.'
        : errorMessage;

    return NextResponse.json(
      { error: safeErrorMessage },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
          'Server-Timing': `error;dur=${durationMs}`,
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }
}
