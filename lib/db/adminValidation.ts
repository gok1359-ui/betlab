import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SavedAnalysisRow = {
  id: string;
  game_pk: number;
  game_date: string;
  home_team: string;
  away_team: string;
  recommendation: string;
  bb_value: number;
  reason: string | null;
};

export type ValidationSummary = {
  total: number;
  hits: number;
  misses: number;
  hitRate: number;
  highBbGames: number;
  highBbHits: number;
  highBbRate: number;
};

export async function getSavedAnalyses(): Promise<SavedAnalysisRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, game_pk, game_date, home_team, away_team, recommendation, bb_value, reason")
    .order("game_date", { ascending: false })
    .order("bb_value", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    game_pk: Number(row.game_pk),
    game_date: String(row.game_date),
    home_team: String(row.home_team ?? ""),
    away_team: String(row.away_team ?? ""),
    recommendation: String(row.recommendation ?? ""),
    bb_value: Number(row.bb_value ?? 0),
    reason: row.reason ? String(row.reason) : null,
  }));
}

export async function getVerificationRows() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("verification_results")
    .select("game_pk, market_type, result, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    gamePk: Number(row.game_pk),
    marketType: String(row.market_type ?? ""),
    result: String(row.result ?? ""),
    createdAt: String(row.created_at ?? ""),
  }));
}

export async function getJoinedValidationRows() {
  const analyses = await getSavedAnalyses();
  const verification = await getVerificationRows();

  const verificationMap = new Map<string, { result: string; createdAt: string }>();
  for (const row of verification) {
    const key = `${row.gamePk}:${row.marketType}`;
    if (!verificationMap.has(key)) {
      verificationMap.set(key, { result: row.result, createdAt: row.createdAt });
    }
  }

  return analyses.map((analysis) => {
    const marketType = analysis.recommendation.includes("언오버")
      ? "total"
      : analysis.recommendation.includes("핸디")
      ? "spread"
      : "moneyline";

    const joined = verificationMap.get(`${analysis.game_pk}:${marketType}`);
    const result = joined?.result ?? "pending";

    return {
      id: analysis.id,
      match: `${analysis.away_team} @ ${analysis.home_team}`,
      gamePk: analysis.game_pk,
      gameDate: analysis.game_date,
      recommendation: analysis.recommendation,
      bb: analysis.bb_value,
      reason: analysis.reason ?? "",
      marketType,
      result,
      verificationCreatedAt: joined?.createdAt ?? "",
    };
  });
}

export async function getValidationSummary(): Promise<ValidationSummary> {
  const rows = await getJoinedValidationRows();
  const doneRows = rows.filter((row) => row.result === "win" || row.result === "loss");
  const hits = doneRows.filter((row) => row.result === "win").length;
  const misses = doneRows.filter((row) => row.result === "loss").length;

  const highBbRows = doneRows.filter((row) => row.bb >= 0.2);
  const highBbHits = highBbRows.filter((row) => row.result === "win").length;

  return {
    total: doneRows.length,
    hits,
    misses,
    hitRate: doneRows.length ? hits / doneRows.length : 0,
    highBbGames: highBbRows.length,
    highBbHits,
    highBbRate: highBbRows.length ? highBbHits / highBbRows.length : 0,
  };
}
