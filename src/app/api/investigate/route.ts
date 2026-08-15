import { NextRequest, NextResponse } from 'next/server';
import { createInvestigation } from '@/lib/osint/investigationEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const domain = body.domain;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const investigation = await createInvestigation(domain);
    return NextResponse.json(investigation);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Investigation process failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
