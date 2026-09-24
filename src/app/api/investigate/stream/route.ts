import { NextRequest } from 'next/server';
import { CentralOrchestrator } from '@/lib/agents/centralOrchestrator';
import { validateAndSanitizeDomain } from '@/lib/osint/validator';
import { logger } from '@/lib/osint/logger';
import { AuthorizationGateRecord } from '@/types/agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = `stream-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  try {
    const body = await req.json();
    const rawDomain = body.domain;
    const authorization: AuthorizationGateRecord | undefined = body.authorization;

    if (!rawDomain || typeof rawDomain !== 'string') {
      return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validation = validateAndSanitizeDomain(rawDomain);
    if (!validation.isValid || !validation.sanitizedDomain) {
      return new Response(JSON.stringify({ error: validation.error || 'Invalid domain syntax' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const domain = validation.sanitizedDomain;
    logger.info('api:investigate:stream', `Initiating SSE streaming pipeline for ${domain}`, undefined, requestId);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          try {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch (e) {
            // Stream closed by client
          }
        };

        try {
          const orchestrator = new CentralOrchestrator({
            domain,
            authorization,
            onEvent: (evt) => {
              sendEvent(evt.type, evt);
            },
          });

          const investigation = await orchestrator.executePipeline();

          sendEvent('complete', {
            type: 'complete',
            agentId: 'orchestrator',
            timestamp: new Date().toISOString(),
            payload: { partialResult: investigation },
          });

          controller.close();
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Orchestration pipeline encountered an error';
          logger.error('api:investigate:stream', `Streaming pipeline error: ${errorMsg}`, err, undefined, requestId);
          sendEvent('error', { error: errorMsg });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Request-Id': requestId,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid request payload';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
