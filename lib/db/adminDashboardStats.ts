import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminDashboardStats = {
  totalAnalyses: number;
  validatedCount: number;
  totalHitRate: number;
  moneylineHitRate: number;
  spreadHitRate: number;
  totalMarketHitRate: number;
  recent7HitRate: number;
  strongPickHitRate: number;
  bbHighHitRate: number;
  bbMidHitRate: number;
  byDate: Array<{
    gameDate: string;
    validatedCount: number;
    winCount: number;
    hitRate: number;
  }>;
};

function getRecentDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function rate(winCount: number, total: number) {
  return total > 0 ? winCount / total : 0;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createSupabaseServerClient();

  const { data: analyses } = await supabase
    .from("analyses")
    .select("game_pk, game_date, market_type, recommendation, bb_value");

  const { data: verifications } = await supabase
    .from("verification_results")
    .select("game_pk, market_type, result, created_at");

  const analysisRows = analyses ?? [];
  const verificationRows = verifications ?? [];

  const verificationMap = new Map<string, string>();
  for (const row of verificationRows as any[]) {
    const key = `${row.game_pk}:${row.market_type}`;
    if (!verificationMap.has(key)) verificationMap.set(key, String(row.result ?? "pending"));
  }

  const joined = (analysisRows as any[]).map((row) => ({
    gameDate: String(row.game_date ?? ""),
    marketType: String(row.market_type ?? "moneyline"),
    recommendation: String(row.recommendation ?? ""),
    bbValue: Number(row.bb_value ?? 0),
    result: verificationMap.get(`${row.game_pk}:${row.market_type}`) ?? "pending",
  }));

  const validated = joined.filter((row) => row.result === "win" || row.result === "loss");
  const totalWins = validated.filter((row) => row.result === "win").length;

  const moneylineRows = validated.filter((row) => row.marketType === "moneyline");
  const spreadRows = validated.filter((row) => row.marketType === "spread");
  const totalRows = validated.filter((row) => row.marketType === "total");
  const recent7Start = getRecentDate(6);
  const recent7Rows = validated.filter((row) => row.gameDate >= recent7Start);
  const strongRows = validated.filter((row) => row.recommendation.includes("강추천"));
  const bbHighRows = validated.filter((row) => row.bbValue >= 0.22);
  const bbMidRows = validated.filter((row) => row.bbValue >= 0.12 && row.bbValue < 0.22);

  const byDateMap = new Map<string, { validatedCount: number; winCount: number }>();
  for (const row of validated) {
    const key = row.gameDate;
    const prev = byDateMap.get(key) ?? { validatedCount: 0, winCount: 0 };
    prev.validatedCount += 1
    if (row.result === "win") prev.winCount += 1;
    byDateMap.set(key, prev);
  }

  const byDate = Array.from(byDateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([gameDate, value]) => ({
      gameDate,
      validatedCount: value.validatedCount,
      winCount: value.winCount,
      hitRate: rate(value.winCount, value.validatedCount),
    }));

  return {
    totalAnalyses: joined.length,
    validatedCount: validated.length,
    totalHitRate: rate(totalWins, validated.length),
    moneylineHitRate: rate(moneylineRows.filter((row) => row.result === "win").length, moneylineRows.length),
    spreadHitRate: rate(spreadRows.filter((row) => row.result === "win").length, spreadRows.length),
    totalMarketHitRate: rate(totalRows.filter((row) => row.result === "win").length, totalRows.length),
    recent7HitRate: rate(recent7Rows.filter((row) => row.result === "win").length, recent7Rows.length),
    strongPickHitRate: rate(strongRows.filter((row) => row.result === "win").length, strongRows.length),
    bbHighHitRate: rate(bbHighRows.filter((row) => row.result === "win").length, bbHighRows.length),
    bbMidHitRate: rate(bbMidRows.filter((row) => row.result === "win").length, bbMidRows.length),
    byDate,
  };
}
