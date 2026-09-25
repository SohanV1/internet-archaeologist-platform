import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import http from 'http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OmniRouteConfig {
  baseUrl: string;
  apiKey: string;
  projectPath?: string;
  routingStrategy: {
    code: string[];
    research: string[];
    general: string[];
  };
  ponytailLevel?: 'lite' | 'full' | 'ultra';
  autoAudit?: boolean;
}

const CONFIG_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.gemini',
  'config',
  'omniroute.json'
);

function loadConfig(): OmniRouteConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
      // Fallback if read/parse error
    }
  }
  return {
    baseUrl: 'http://localhost:20128',
    apiKey: 'sk-antigravity-86cae247e592ccf7d396b49d4f745a39',
    routingStrategy: {
      code: ['auto/best-coding', 'kr/claude-sonnet-4.5', 'gh/claude-sonnet-5'],
      research: ['auto/best-fast', 'kr/claude-haiku-4.5', 'oc/deepseek-v4-flash-free'],
      general: ['auto/best-chat', 'kr/claude-haiku-4.5'],
    },
    ponytailLevel: 'full',
    autoAudit: true,
  };
}

async function checkHealth(baseUrl: string, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const url = new URL('/v1/models', baseUrl);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 20128,
          path: url.pathname,
          method: 'GET',
          timeout: timeoutMs,
        },
        (res) => {
          resolve(res.statusCode === 200 || res.statusCode === 401);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function buildPonytailSystemPrompt(level = 'full'): string {
  const prompts: Record<string, string> = {
    lite: 'You are governed by Ponytail Lite: Build what is requested, state the simplest alternative.',
    full: `You are governed by strict Ponytail principles:
The ladder enforced:
1. Does this need to exist? (YAGNI).
2. Reuse existing domain knowledge, findings, and evidence.
3. Standard library and native platform first.
4. Minimal analytical output that delivers direct, high-value OSINT insight. Shortest precise answer wins.
No unrequested fluff, no boilerplate disclaimers. Provide sharp, forensic analysis with clear recommendations.`,
    ultra: 'You are governed by Ponytail Ultra: Maximum precision, zero boilerplate. Give the sharpest analytical verdict.',
  };
  return prompts[level] || prompts.full;
}

function runPonytailAudit(content: string): string[] {
  const findings: string[] = [];
  if (content.includes('class ') && content.includes('Factory')) {
    findings.push('yagni: Factory class detected. Replacement: direct functional dispatch.');
  }
  if (content.match(/interface [A-Za-z0-9_]+ \{\s*\}/)) {
    findings.push('delete: Empty interface detected.');
  }
  if (content.length > 5000 && !content.includes('```')) {
    findings.push('shrink: Verbose unstructured output. Structure into concise bullet points.');
  }
  return findings;
}

async function sendChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  timeoutMs = 60000
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', baseUrl);
    const postData = JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    });

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 20128,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.message?.content || '';
              resolve({ content, usage: parsed.usage });
            } catch (e: unknown) {
              reject(new Error(`Failed to parse completion: ${(e as Error).message}`));
            }
          } else {
            reject(new Error(`OmniRoute error (HTTP ${res.statusCode}): ${data.slice(0, 300)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OmniRoute subagent request timed out after 60s'));
    });

    req.write(postData);
    req.end();
  });
}

// GET /api/subagents - Returns OmniRoute server status & available models
export async function GET() {
  const config = loadConfig();
  const isOnline = await checkHealth(config.baseUrl);

  let activeModels: string[] = [];
  if (isOnline) {
    try {
      const url = new URL('/v1/models', config.baseUrl);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data)) {
          activeModels = data.data.map((m: { id: string }) => m.id);
        }
      }
    } catch {
      // Ignore if fetch fails
    }
  }

  // Merge configured candidate models
  const configuredModels = [
    ...(config.routingStrategy.code || []),
    ...(config.routingStrategy.research || []),
    ...(config.routingStrategy.general || []),
  ];
  const allModels = Array.from(new Set([...activeModels, ...configuredModels]));

  return NextResponse.json({
    online: isOnline,
    baseUrl: config.baseUrl,
    port: 20128,
    routingStrategy: config.routingStrategy,
    ponytailLevel: config.ponytailLevel || 'full',
    models: allModels.slice(0, 20),
  });
}

// POST /api/subagents - Dispatches subagent task through OmniRoute
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const config = loadConfig();

  try {
    const body = await req.json();
    const {
      prompt,
      role = 'research',
      model: explicitModel,
      targetDomain,
      contextData,
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Task prompt is required' }, { status: 400 });
    }

    const isOnline = await checkHealth(config.baseUrl);
    if (!isOnline) {
      return NextResponse.json(
        {
          error:
            'OmniRoute instance is currently offline on port 20128. Please ensure OmniRoute is running via `node bin/omniroute.mjs serve` in your OmniRoute directory.',
        },
        { status: 503 }
      );
    }

    const candidateModels: string[] = explicitModel
      ? [explicitModel]
      : (config.routingStrategy as Record<string, string[]>)[role] || config.routingStrategy.research || ['auto/best-fast'];

    const systemPrompt = buildPonytailSystemPrompt(config.ponytailLevel || 'full');

    let fullUserPrompt = prompt;
    if (targetDomain) {
      fullUserPrompt = `[Target Domain: ${targetDomain}]\n\n${fullUserPrompt}`;
    }
    if (contextData && typeof contextData === 'string') {
      fullUserPrompt += `\n\n[Context Findings]:\n${contextData.slice(0, 3000)}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fullUserPrompt },
    ];

    let lastError: Error | null = null;
    let successfulModel = '';
    let responseContent = '';
    let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;

    for (const model of candidateModels) {
      try {
        const res = await sendChatCompletion(config.baseUrl, config.apiKey, model, messages);
        successfulModel = model;
        responseContent = res.content;
        usage = res.usage;
        break;
      } catch (err: unknown) {
        lastError = err as Error;
      }
    }

    if (!responseContent && lastError) {
      return NextResponse.json(
        { error: `OmniRoute subagent dispatch failed: ${lastError.message}` },
        { status: 502 }
      );
    }

    const auditFindings = config.autoAudit ? runPonytailAudit(responseContent) : [];
    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      model: successfulModel,
      result: responseContent,
      auditFindings,
      usage,
      executionTimeMs,
      ponytailLevel: config.ponytailLevel || 'full',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
