import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AnalysisRow = {
  game_pk: number;
  game_date: string;
  market_type: string;
  recommendation: string;
};

function pickResult(
  recommendation: string,
  marketType: string,
  homeScore: number,
  awayScore: number
) {
  if (marketType === "moneyline") {
    if (homeScore === awayScore) return "push";
    const homeWon = homeScore > awayScore;
    const leanHome = recommendation.includes("홈");
    return leanHome ? (homeWon ? "win" : "loss") : (homeWon ? "loss" : "win");
  }

  if (marketType === "total") {
    const total = homeScore + awayScore;
    const line = 8.5;
    if (total === line) return "push";
    const over = total > line;
    const leanOver = recommendation.includes("오버");
    return leanOver ? (over ? "win" : "loss") : (over ? "loss" : "win");
  }

  if (marketType === "spread") {
    const line = 1.5;
    const margin = homeScore - awayScore;
    const leanHome = recommendation.includes("홈");
    const covered = leanHome ? margin > line : (-margin) > line;
    return covered ? "win" : "loss";
  }

  return "pending";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const startDate = String(body?.startDate ?? "").trim();
    const endDate = String(body?.endDate ?? "").trim();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: "startDate and endDate required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: analyses, error: analysesError } = await supabase
      .from("analyses")
      .select("game_pk, game_date, market_type, recommendation")
      .gte("game_date", startDate)
      .lte("game_date", endDate)
      .order("game_date", { ascending: true });

    if (analysesError) {
      return NextResponse.json(
        { ok: false, error: analysesError.message },
        { status: 500 }
      );
    }

    const analysisRows = (analyses ?? []) as AnalysisRow[];
    if (!analysisRows.length) {
      return NextResponse.json({ ok: true, savedCount: 0, dedupedCount: 0 });
    }

    const dateList = [
      ...new Set(analysisRows.map((row) => String(row.game_date).slice(0, 10))),
    ];

    const gameResultMap = new Map<
      string,
      { homeScore: number; awayScore: number; isFinal: boolean }
    >();

    for (const date of dateList) {
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`,
        { cache: "no-store" }
      );
      const json = await response.json().catch(() => null);
      if (!response.ok || !json) continue;

      for (const day of json.dates ?? []) {
        for (const game of day.games ?? []) {
          gameResultMap.set(`${game.gamePk}:${date}`, {
            homeScore: Number(game?.teams?.home?.score ?? 0),
            awayScore: Number(game?.teams?.away?.score ?? 0),
            isFinal:
              String(game?.status?.abstractGameState ?? "").toLowerCase() === "final" ||
              String(game?.status?.detailedState ?? "").toLowerCase() === "final",
          });
        }
      }
    }

    const uniqueMap = new Map<
      string,
      {
        game_pk: number;
        market_type: string;
        result: string;
        created_at: string;
      }
    >();

    for (const row of analysisRows) {
      const date = String(row.game_date).slice(0, 10);
      const resultRow = gameResultMap.get(`${row.game_pk}:${date}`);
      if (!resultRow || !resultRow.isFinal) continue;

      const marketType = String(row.market_type ?? "moneyline");
      const dedupeKey = `${row.game_pk}:${marketType}`;

      uniqueMap.set(dedupeKey, {
        game_pk: Number(row.game_pk),
        market_type: marketType,
        result: pickResult(
          String(row.recommendation ?? ""),
          marketType,
          resultRow.homeScore,
          resultRow.awayScore
        ),
        created_at: new Date().toISOString(),
      });
    }

    const upsertRows = Array.from(uniqueMap.values());

    if (!upsertRows.length) {
      return NextResponse.json({ ok: true, savedCount: 0, dedupedCount: 0 });
    }

    const { error: upsertError } = await supabase
      .from("verification_results")
      .upsert(upsertRows, { onConflict: "game_pk,market_type" });

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      savedCount: upsertRows.length,
      dedupedCount: analysisRows.length - upsertRows.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "backfill failed",
      },
      { status: 500 }
    );
  }
}
