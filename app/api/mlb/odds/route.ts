import { NextRequest, NextResponse } from 'next/server';
import { buildOddsApiWindow, fetchMlbOddsByDate } from '@/lib/mlb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { ok: false, error: 'date query is required' },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.ODDS_API_KEY || '';
    const debug = searchParams.get('debug') === '1';

    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        hasApiKey: false,
        keyPreview: '',
        oddsCount: 0,
        oddsByGame: {},
        marketSource: 'missing_api_key',
        debug,
      });
    }

    const result = await fetchMlbOddsByDate(date, apiKey);

    return NextResponse.json({
      ok: true,
      hasApiKey: true,
      keyPreview: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
      marketSource: result.marketSource,
      commenceTimeFrom: result.commenceTimeFrom,
      commenceTimeTo: result.commenceTimeTo,
      oddsCount: Object.keys(result.oddsByGame).length,
      oddsByGame: result.oddsByGame,
      rawCount: debug ? result.rawCount : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'failed to fetch odds';

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
