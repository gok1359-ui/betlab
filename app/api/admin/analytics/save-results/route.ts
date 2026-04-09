import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const results = Array.isArray(body?.results) ? body.results : [];

    if (!results.length) {
      return NextResponse.json({ ok: false, error: "results required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const rows = results.map((result: any) => ({
      game_pk: Number(result.gamePk),
      game_date: String(result.gameDate ?? "").slice(0, 10),
      home_team: String(result.homeTeam ?? ""),
      away_team: String(result.awayTeam ?? ""),
      market_type: result.recommendation?.includes("언오버")
        ? "total"
        : result.recommendation?.includes("핸디")
        ? "spread"
        : "moneyline",
      recommendation: String(result.recommendation ?? ""),
      bb_value: Number(result.bbValue ?? 0),
      reason: String(result.reason ?? ""),
      expected_home_runs: 0,
      expected_away_runs: 0,
      expected_margin: 0,
      expected_total: 0,
      bb_breakdown_json: {},
    }));

    const { error } = await supabase.from("analyses").insert(rows);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedCount: rows.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "save results failed" },
      { status: 500 }
    );
  }
}
