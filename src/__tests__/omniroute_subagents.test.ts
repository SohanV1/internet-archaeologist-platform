/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/subagents/route';
import { NextRequest } from 'next/server';

describe('OmniRoute Subagents API Route', () => {
  it('GET /api/subagents returns OmniRoute status and model list', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('online');
    expect(typeof data.online).toBe('boolean');
    expect(data).toHaveProperty('baseUrl');
    expect(data).toHaveProperty('routingStrategy');
    expect(data).toHaveProperty('ponytailLevel');
    expect(Array.isArray(data.models)).toBe(true);
  });

  it('POST /api/subagents rejects request when prompt is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/subagents', {
      method: 'POST',
      body: JSON.stringify({ role: 'research' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Task prompt is required/);
  });

  it('POST /api/subagents dispatches prompt and returns Ponytail-Audit verified result', async () => {
    const req = new NextRequest('http://localhost:3000/api/subagents', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Analyze DNS hygiene in 2 short bullet points.',
        role: 'research',
        targetDomain: 'example.com',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    // If OmniRoute is running locally, it should succeed
    if (res.status === 200) {
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('model');
      expect(data).toHaveProperty('auditFindings');
      expect(Array.isArray(data.auditFindings)).toBe(true);
      expect(data.ponytailLevel).toBe('full');
    } else {
      // If offline in test runner environment
      expect(res.status).toBe(503);
      expect(data.error).toMatch(/OmniRoute/);
    }
  });
});
