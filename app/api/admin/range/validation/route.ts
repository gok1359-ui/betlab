import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const startDate = String(body?.startDate ?? "").trim();
    const endDate = String(body?.endDate ?? "").trim();

    if (!startDate || !endDate) {
      return NextResponse.json({ ok: false, error: "startDate and endDate required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data: analyses, error: analysesError } = await supabase
      .from("analyses")
      .select("game_pk, game_date, home_team, away_team, market_type, recommendation, bb_value")
      .gte("game_date", startDate)
      .lte("game_date", endDate)
      .order("game_date", { ascending: true });

    if (analysesError) {
      return NextResponse.json({ ok: false, error: analysesError.message }, { status: 500 });
    }

    const { data: verifications, error: verifyError } = await supabase
      .from("verification_results")
      .select("game_pk, market_type, result")
      .order("created_at", { ascending: false });

    if (verifyError) {
      return NextResponse.json({ ok: false, error: verifyError.message }, { status: 500 });
    }

    const verificationMap = new Map<string, string>();
    for (const row of verifications ?? []) {
      const key = `${row.game_pk}:${row.market_type}`;
      if (!verificationMap.has(key)) {
        verificationMap.set(key, String(row.result ?? "pending"));
      }
    }

    const rows = (analyses ?? []).map((row) => ({
      gamePk: Number(row.game_pk),
      gameDate: String(row.game_date ?? ""),
      homeTeam: String(row.home_team ?? ""),
      awayTeam: String(row.away_team ?? ""),
      marketType: String(row.market_type ?? "moneyline"),
      recommendation: String(row.recommendation ?? ""),
      bbValue: Number(row.bb_value ?? 0),
      result: verificationMap.get(`${row.game_pk}:${row.market_type}`) ?? "pending",
    }));

    const validated = rows.filter((row) => row.result === "win" || row.result === "loss");
    const winCount = validated.filter((row) => row.result === "win").length;
    const lossCount = validated.filter((row) => row.result === "loss").length;
    const hitRate = validated.length ? winCount / validated.length : 0;

    return NextResponse.json({
      ok: true,
      rows,
      summary: {
        validatedCount: validated.length,
        winCount,
        lossCount,
        hitRate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "range validation failed" },
      { status: 500 }
    );
  }
}
