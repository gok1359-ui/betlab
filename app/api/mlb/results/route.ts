import { NextRequest, NextResponse } from 'next/server';

const MLB_BASE = 'https://statsapi.mlb.com/api/v1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ ok: false, error: 'date query is required' }, { status: 400 });
  }

  try {
    const url = `${MLB_BASE}/schedule?sportId=1&date=${date}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `MLB results error: ${res.status}`);
    }

    const data = await res.json();
    const games = (data?.dates ?? []).flatMap((d: any) => d?.games ?? []);

    const results = games.map((game: any) => {
      const homeScore = Number(game?.teams?.home?.score ?? 0);
      const awayScore = Number(game?.teams?.away?.score ?? 0);
      const state = String(game?.status?.abstractGameState ?? game?.status?.detailedState ?? '').toLowerCase();
      const isFinal = state.includes('final') || state.includes('completed') || state.includes('game over');

      return {
        gamePk: game?.gamePk ?? null,
        isFinal,
        state: game?.status?.detailedState ?? game?.status?.abstractGameState ?? '-',
        homeTeam: game?.teams?.home?.team?.name ?? 'Home',
        awayTeam: game?.teams?.away?.team?.name ?? 'Away',
        homeScore,
        awayScore,
        totalScore: homeScore + awayScore,
        margin: homeScore - awayScore,
      };
    });

    return NextResponse.json({
      ok: true,
      date,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'failed to fetch results',
      },
      { status: 500 }
    );
  }
}
