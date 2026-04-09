import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeGameReal } from "@/lib/engine/betlabAnalysis";

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

async function loadEngineSettings() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("settings_json")
    .eq("settings_key", "betlab_core")
    .maybeSingle();

  return {
    ...DEFAULT_SETTINGS,
    ...(data?.settings_json ?? {}),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const games = Array.isArray(body?.games) ? body.games : [];

    if (!games.length) {
      return NextResponse.json({ ok: false, error: "games required" }, { status: 400 });
    }

    const settings = await loadEngineSettings();
    const results = [];

    for (const game of games) {
      try {
        const analyzed = await analyzeGameReal(
          {
            gamePk: Number(game.gamePk),
            gameDate: String(game.gameDate ?? "").slice(0, 10),
            homeTeam: String(game.homeTeam ?? ""),
            awayTeam: String(game.awayTeam ?? ""),
          },
          settings
        );

        results.push({
          gamePk: analyzed.gamePk,
          gameDate: analyzed.gameDate,
          homeTeam: analyzed.homeTeam,
          awayTeam: analyzed.awayTeam,
          recommendation: analyzed.recommendation,
          bbValue: analyzed.bbValue,
          reason: analyzed.reason,
          marketType: analyzed.marketType,
          expectedHomeRuns: analyzed.expectedHomeRuns,
          expectedAwayRuns: analyzed.expectedAwayRuns,
          expectedMargin: analyzed.expectedMargin,
          expectedTotal: analyzed.expectedTotal,
          bbBreakdown: analyzed.bbBreakdown,
        });
      } catch (gameError) {
        results.push({
          gamePk: Number(game.gamePk),
          gameDate: String(game.gameDate ?? "").slice(0, 10),
          homeTeam: String(game.homeTeam ?? ""),
          awayTeam: String(game.awayTeam ?? ""),
          recommendation: "관찰",
          bbValue: 0.08,
          reason: gameError instanceof Error ? `분석 보조 실패: ${gameError.message}` : "분석 보조 실패",
          marketType: "moneyline",
          expectedHomeRuns: 4.4,
          expectedAwayRuns: 4.2,
          expectedMargin: 0.2,
          expectedTotal: 8.6,
          bbBreakdown: {
            homeAdvantage: 0.05,
            starter: 0.01,
            batting: 0.01,
            bullpen: 0.01,
            form: 0.0,
            total: 0.08,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, results, settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "engine linked analysis failed" },
      { status: 500 }
    );
  }
}
