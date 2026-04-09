import { NextRequest, NextResponse } from 'next/server';
import { getMlbSchedule } from '@/lib/mlb';

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');
    if (!date) {
      return NextResponse.json({ ok: false, error: 'date query is required' }, { status: 400 });
    }
    const data = await getMlbSchedule(date);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
