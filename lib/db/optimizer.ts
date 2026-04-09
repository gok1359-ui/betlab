import { createSupabaseServerClient } from "@/lib/supabase/server";

type AnalysisRow = {
  game_date: string;
  market_type: string;
  recommendation: string;
  bb_value: number;
  game_pk: number;
};

type VerificationRow = {
  game_pk: number;
  market_type: string;
  result: string;
};

export type OptimizeResult = {
  inspectedCount: number;
  validatedCount: number;
  overallHitRate: number;
  byMarket: {
    moneyline: number;
    spread: number;
    total: number;
  };
  suggestedWeights: {
    moneyline: { homeAdv: number; pitcher: number; batting: number; bullpen: number; recent: number };
    spread: { homeAdv: number; pitcher: number; batting: number; bullpen: number; recent: number };
    total: { homeAdv: number; pitcher: number; batting: number; bullpen: number; recent: number };
  };
};

function rate(wins: number, total: number) {
  return total > 0 ? wins / total : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function runOptimizer(startDate: string, endDate: string): Promise<OptimizeResult> {
  const supabase = createSupabaseServerClient();

  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("game_date, market_type, recommendation, bb_value, game_pk")
    .gte("game_date", startDate)
    .lte("game_date", endDate);

  if (analysesError) throw new Error(analysesError.message);

  const { data: verification, error: verificationError } = await supabase
    .from("verification_results")
    .select("game_pk, market_type, result");

  if (verificationError) throw new Error(verificationError.message);

  const verifyMap = new Map<string, string>();
  for (const row of (verification ?? []) as VerificationRow[]) {
    const key = `${row.game_pk}:${row.market_type}`;
    if (!verifyMap.has(key)) verifyMap.set(key, String(row.result ?? "pending"));
  }

  const joined = ((analyses ?? []) as AnalysisRow[]).map((row) => ({
    gameDate: String(row.game_date ?? ""),
    marketType: String(row.market_type ?? "moneyline"),
    recommendation: String(row.recommendation ?? ""),
    bbValue: Number(row.bb_value ?? 0),
    result: verifyMap.get(`${row.game_pk}:${row.market_type}`) ?? "pending",
  }));

  const validated = joined.filter((row) => row.result === "win" || row.result === "loss");
  const wins = validated.filter((row) => row.result === "win").length;

  const ml = validated.filter((row) => row.marketType === "moneyline");
  const sp = validated.filter((row) => row.marketType === "spread");
  const tt = validated.filter((row) => row.marketType === "total");

  const mlRate = rate(ml.filter((row) => row.result === "win").length, ml.length);
  const spRate = rate(sp.filter((row) => row.result === "win").length, sp.length);
  const ttRate = rate(tt.filter((row) => row.result === "win").length, tt.length);

  const suggestedWeights = {
    moneyline: {
      homeAdv: round2(clamp(0.05 + (mlRate - 0.5) * 0.04, 0.02, 0.08)),
      pitcher: round2(clamp(0.40 + (mlRate - 0.5) * 0.20, 0.28, 0.52)),
      batting: round2(clamp(0.22 - (mlRate - 0.5) * 0.06, 0.16, 0.30)),
      bullpen: round2(clamp(0.23 + (mlRate - 0.5) * 0.10, 0.16, 0.32)),
      recent: round2(clamp(0.10 + (mlRate - 0.5) * 0.04, 0.06, 0.16)),
    },
    spread: {
      homeAdv: round2(clamp(0.03 + (spRate - 0.5) * 0.03, 0.01, 0.06)),
      pitcher: round2(clamp(0.24 + (spRate - 0.5) * 0.08, 0.18, 0.32)),
      batting: round2(clamp(0.35 + (spRate - 0.5) * 0.14, 0.25, 0.48)),
      bullpen: round2(clamp(0.20 + (spRate - 0.5) * 0.08, 0.14, 0.28)),
      recent: round2(clamp(0.18 + (spRate - 0.5) * 0.08, 0.10, 0.26)),
    },
    total: {
      homeAdv: round2(clamp(0.01 + (ttRate - 0.5) * 0.02, 0.00, 0.04)),
      pitcher: round2(clamp(0.20 - (ttRate - 0.5) * 0.05, 0.12, 0.26)),
      batting: round2(clamp(0.45 + (ttRate - 0.5) * 0.12, 0.32, 0.58)),
      bullpen: round2(clamp(0.10 + (ttRate - 0.5) * 0.08, 0.05, 0.18)),
      recent: round2(clamp(0.24 + (ttRate - 0.5) * 0.10, 0.14, 0.34)),
    },
  };

  return {
    inspectedCount: joined.length,
    validatedCount: validated.length,
    overallHitRate: rate(wins, validated.length),
    byMarket: {
      moneyline: mlRate,
      spread: spRate,
      total: ttRate,
    },
    suggestedWeights,
  };
}
