import { NextResponse } from 'next/server';
import { getDynamicCodebaseAnalytics } from '@/lib/osint/codebaseScanner';
import { AnalyticsApiResponse } from '@/types/api';

export async function GET(): Promise<NextResponse<AnalyticsApiResponse>> {
  try {
    const data = getDynamicCodebaseAnalytics();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to scan codebase';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
