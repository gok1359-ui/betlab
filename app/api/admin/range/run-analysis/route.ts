import { NextResponse } from "next/server";
import { analyzeGameReal } from "@/lib/engine/betlabAnalysis";

type RangeAnalysisRow = {
  gamePk?: number;
  gameDate?: string;
  homeTeam?: string;
  awayTeam?: string;
  recommendation?: string;
  bbValue?: number;
  reason?: string;
  marketType?: string;
  expectedHomeRuns?: number;
  expectedAwayRuns?: number;
  expectedMargin?: number;
  expectedTotal?: number;
  [key: string]: unknown;
};

const DEFAULT_SETTINGS = {
  homeAdvantage: 0.12,
  pitcherWeight: 1.0,
  formWeight: 0.8,
  battingWeight: 0.9,
  bullpenWeight: 0.85,
  totalWeight: 1.0,
  strongThreshold: 0.22,
  mediumThreshold: 0.12,
};

function enumerateDates(startDate: string, endDate: string) {
  const result: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return result;
  }

  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    result.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

async function fetchScheduleGames(date: string) {
  const response = await fetch(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`,
    { cache: "no-store" }
  );

  if (!response.ok) return [];
  const json = await response.json().catch(() => null);
  if (!json) return [];

  const games: Array<{
    gamePk: number;
    gameDate: string;
    homeTeam: string;
    awayTeam: string;
  }> = [];

  for (const day of json.dates ?? []) {
    for (const game of day.games ?? []) {
      games.push({
        gamePk: Number(game.gamePk ?? 0),
        gameDate: String(game.gameDate ?? date).slice(0, 10),
        homeTeam: String(game?.teams?.home?.team?.name ?? ""),
        awayTeam: String(game?.teams?.away?.team?.name ?? ""),
      });
    }
  }

  return games;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const startDate = String(body?.startDate ?? "").trim();
    const endDate = String(body?.endDate ?? "").trim();
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(body?.settings ?? {}),
    };

    if (!startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const dates = enumerateDates(startDate, endDate);
    if (dates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "invalid date range" },
        { status: 400 }
      );
    }

    const results: RangeAnalysisRow[] = [];

    for (const date of dates) {
      const games = await fetchScheduleGames(date);

      for (const game of games) {
        try {
          const analyzed = await analyzeGameReal(
            {
              gamePk: game.gamePk,
              gameDate: game.gameDate,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
            },
            settings
          );

          results.push({
            gamePk: analyzed.gamePk,
            gameDate: analyzed.gameDate,
            homeTeam: analyzed.homeTeam,
            awayTeam: analyzed.awayTeam,
            recommendation: analyzed.recommendation,
            bbValue: Number(analyzed.bbValue ?? 0),
            reason: analyzed.reason,
            marketType: analyzed.marketType,
            expectedHomeRuns: Number(analyzed.expectedHomeRuns ?? 0),
            expectedAwayRuns: Number(analyzed.expectedAwayRuns ?? 0),
            expectedMargin: Number(analyzed.expectedMargin ?? 0),
            expectedTotal: Number(analyzed.expectedTotal ?? 0),
          });
        } catch {
          // continue on per-game failures
        }
      }
    }

    const strongCount = results.filter((row: RangeAnalysisRow) => Number(row.bbValue ?? 0) >= 0.22).length;
    const mediumCount = results.filter(
      (row: RangeAnalysisRow) => Number(row.bbValue ?? 0) >= 0.12 && Number(row.bbValue ?? 0) < 0.22
    ).length;
    const avgBb = results.length
      ? results.reduce((sum: number, row: RangeAnalysisRow) => sum + Number(row.bbValue ?? 0), 0) / results.length
      : 0;

    return NextResponse.json({
      ok: true,
      results,
      summary: {
        totalCount: results.length,
        strongCount,
        mediumCount,
        avgBb,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "range analysis failed",
      },
      { status: 500 }
    );
  }
}
