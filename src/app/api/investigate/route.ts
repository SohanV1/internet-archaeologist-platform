import { NextRequest, NextResponse } from 'next/server';
import { createInvestigation } from '@/lib/osint/investigationEngine';
import { InvestigateRequestBody, InvestigateApiResponse } from '@/types/api';

export async function POST(req: NextRequest): Promise<NextResponse<InvestigateApiResponse>> {
  try {
    const body: Partial<InvestigateRequestBody> = await req.json();
    const domain = body.domain;

    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return NextResponse.json(
        { error: 'Domain parameter is required and must be a valid non-empty string' },
        { status: 400 }
      );
    }

    const investigation = await createInvestigation(domain.trim());
    return NextResponse.json(investigation);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Investigation process failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
