import { NextRequest, NextResponse } from "next/server";
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

function getBaseballDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function enumerateDatesBack(days: number) {
  return Array.from({ length: days }, (_, i) => getBaseballDate(-i));
}

function isAuthorizedCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
}

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

async function fetchScheduleGames(date: string) {
  const response = await fetch(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`,
    { cache: "no-store" }
  );

  if (!response.ok) return [];
  const json = await response.json().catch(() => null);
  if (!json) return [];

  const games = [];
  for (const day of json.dates ?? []) {
    for (const game of day.games ?? []) {
      games.push({
        gamePk: Number(game.gamePk),
        gameDate: String(game.gameDate ?? date).slice(0, 10),
        homeTeam: String(game?.teams?.home?.team?.name ?? ""),
        awayTeam: String(game?.teams?.away?.team?.name ?? ""),
      });
    }
  }

  return games;
}

async function saveAutomationLog(payload: {
  runType: string;
  analyzedCount: number;
  savedAnalysesCount: number;
  verificationSavedCount: number;
  settlementSettledCount: number;
  settlementAffectedUsers: number;
  status: string;
  message: string;
}) {
  const supabase = createSupabaseServerClient();
  await supabase.from("automation_runs").insert({
    run_type: payload.runType,
    analyzed_count: payload.analyzedCount,
    saved_analyses_count: payload.savedAnalysesCount,
    verification_saved_count: payload.verificationSavedCount,
    settlement_settled_count: payload.settlementSettledCount,
    settlement_affected_users: payload.settlementAffectedUsers,
    status: payload.status,
    message: payload.message,
    created_at: new Date().toISOString(),
  });
}

async function runDailyAnalysisAndSave() {
  const supabase = createSupabaseServerClient();
  const settings = await loadEngineSettings();
  const today = getBaseballDate(0);
  const games = await fetchScheduleGames(today);

  if (!games.length) return { analyzedCount: 0, savedCount: 0 };

  const analyzedRows = [];

  for (const game of games) {
    try {
      const analyzed = await analyzeGameReal(
        {
          gamePk: Number(game.gamePk),
          gameDate: String(game.gameDate ?? today),
          homeTeam: String(game.homeTeam ?? ""),
          awayTeam: String(game.awayTeam ?? ""),
        },
        settings
      );

      analyzedRows.push({
        game_pk: analyzed.gamePk,
        game_date: analyzed.gameDate,
        home_team: analyzed.homeTeam,
        away_team: analyzed.awayTeam,
        market_type: analyzed.marketType,
        recommendation: analyzed.recommendation,
        bb_value: analyzed.bbValue,
        reason: analyzed.reason,
        expected_home_runs: analyzed.expectedHomeRuns,
        expected_away_runs: analyzed.expectedAwayRuns,
        expected_margin: analyzed.expectedMargin,
        expected_total: analyzed.expectedTotal,
        bb_breakdown_json: analyzed.bbBreakdown,
      });
    } catch {}
  }

  if (!analyzedRows.length) return { analyzedCount: games.length, savedCount: 0 };

  const { error } = await supabase
    .from("analyses")
    .upsert(analyzedRows, { onConflict: "game_pk,market_type,game_date" });

  if (error) throw new Error(error.message);

  return { analyzedCount: games.length, savedCount: analyzedRows.length };
}

function pickVerificationResult(
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
    const line = 8.5;
    const total = homeScore + awayScore;
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

async function backfillRecentVerification(daysBack = 7) {
  const supabase = createSupabaseServerClient();
  const dates = enumerateDatesBack(daysBack);
  const startDate = dates[dates.length - 1];
  const endDate = dates[0];

  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("game_pk, game_date, market_type, recommendation")
    .gte("game_date", startDate)
    .lte("game_date", endDate)
    .order("game_date", { ascending: true });

  if (analysesError) throw new Error(analysesError.message);

  const analysisRows = analyses ?? [];
  if (!analysisRows.length) return { verificationSavedCount: 0 };

  const dateSet = [...new Set((analysisRows as any[]).map((row) => String(row.game_date).slice(0, 10)))];
  const resultMap = new Map<string, { homeScore: number; awayScore: number; isFinal: boolean }>();

  for (const date of dateSet) {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`,
      { cache: "no-store" }
    );
    if (!response.ok) continue;
    const json = await response.json().catch(() => null);
    if (!json) continue;

    for (const day of json.dates ?? []) {
      for (const game of day.games ?? []) {
        resultMap.set(`${game.gamePk}:${date}`, {
          homeScore: Number(game?.teams?.home?.score ?? 0),
          awayScore: Number(game?.teams?.away?.score ?? 0),
          isFinal:
            String(game?.status?.abstractGameState ?? "").toLowerCase() === "final" ||
            String(game?.status?.detailedState ?? "").toLowerCase() === "final",
        });
      }
    }
  }

  const uniqueMap = new Map<string, any>();

  for (const row of analysisRows as any[]) {
    const date = String(row.game_date).slice(0, 10);
    const resultRow = resultMap.get(`${row.game_pk}:${date}`);
    if (!resultRow || !resultRow.isFinal) continue;

    const marketType = String(row.market_type ?? "moneyline");
    const key = `${row.game_pk}:${marketType}`;

    uniqueMap.set(key, {
      game_pk: Number(row.game_pk),
      market_type: marketType,
      result: pickVerificationResult(
        String(row.recommendation ?? ""),
        marketType,
        resultRow.homeScore,
        resultRow.awayScore
      ),
      created_at: new Date().toISOString(),
    });
  }

  const upsertRows = Array.from(uniqueMap.values());
  if (!upsertRows.length) return { verificationSavedCount: 0 };

  const { error: upsertError } = await supabase
    .from("verification_results")
    .upsert(upsertRows, { onConflict: "game_pk,market_type" });

  if (upsertError) throw new Error(upsertError.message);

  return { verificationSavedCount: upsertRows.length };
}

async function runSettlement(origin: string, authHeader: string) {
  const response = await fetch(`${origin}/api/points/settle`, {
    method: "GET",
    headers: { authorization: authHeader },
    cache: "no-store",
  });

  const json = await response.json().catch(() => ({ ok: false }));
  return {
    settlementOk: Boolean(json.ok),
    settlementSettledCount: Number(json.settledCount ?? 0),
    settlementAffectedUsers: Number(json.affectedUsers ?? 0),
  };
}

async function executeAutoOps(origin: string, runType: string, authHeader: string) {
  const analysis = await runDailyAnalysisAndSave();
  const verification = await backfillRecentVerification(7);
  const settlement = await runSettlement(origin, authHeader);

  await saveAutomationLog({
    runType,
    analyzedCount: analysis.analyzedCount,
    savedAnalysesCount: analysis.savedCount,
    verificationSavedCount: verification.verificationSavedCount,
    settlementSettledCount: settlement.settlementSettledCount,
    settlementAffectedUsers: settlement.settlementAffectedUsers,
    status: "success",
    message: "자동 운영 실행 완료",
  });

  return {
    ok: true,
    mode: "auto-ops",
    ...analysis,
    ...verification,
    ...settlement,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ ok: false, error: "unauthorized cron" }, { status: 401 });
    }

    const origin = new URL(request.url).origin;
    const authHeader = request.headers.get("authorization") ?? "";
    const result = await executeAutoOps(origin, "cron", authHeader);
    return NextResponse.json(result);
  } catch (error) {
    await saveAutomationLog({
      runType: "cron",
      analyzedCount: 0,
      savedAnalysesCount: 0,
      verificationSavedCount: 0,
      settlementSettledCount: 0,
      settlementAffectedUsers: 0,
      status: "failed",
      message: error instanceof Error ? error.message : "auto ops failed",
    });

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "auto ops failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization") ?? "";
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized manual run" }, { status: 401 });
    }

    const origin = new URL(request.url).origin;
    const result = await executeAutoOps(origin, "manual", authHeader);
    return NextResponse.json(result);
  } catch (error) {
    await saveAutomationLog({
      runType: "manual",
      analyzedCount: 0,
      savedAnalysesCount: 0,
      verificationSavedCount: 0,
      settlementSettledCount: 0,
      settlementAffectedUsers: 0,
      status: "failed",
      message: error instanceof Error ? error.message : "manual auto ops failed",
    });

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "manual auto ops failed" },
      { status: 500 }
    );
  }
}
