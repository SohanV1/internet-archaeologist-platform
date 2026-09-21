import { NextRequest, NextResponse } from 'next/server';
import { createInvestigation } from '@/lib/osint/investigationEngine';
import { validateAndSanitizeDomain } from '@/lib/osint/validator';
import { logger } from '@/lib/osint/logger';
import { InvestigateRequestBody, InvestigateApiResponse } from '@/types/api';

export async function POST(req: NextRequest): Promise<NextResponse<InvestigateApiResponse>> {
  const startTime = performance.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

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

    const investigation = await createInvestigation(validation.sanitizedDomain);
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
      },
    });
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? err.message : 'Investigation process failed';

    logger.error('api:investigate', `Unhandled API error: ${errorMessage}`, err, { durationMs }, requestId);

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
          'Server-Timing': `error;dur=${durationMs}`,
        },
      }
    );
  }
}
