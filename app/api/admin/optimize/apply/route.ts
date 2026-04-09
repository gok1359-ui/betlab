import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_SETTINGS = {
  homeAdvantage: 0.12,
  pitcherWeight: 1.0,
  formWeight: 0.8,
  battingWeight: 0.9,
  bullpenWeight: 0.85,
  totalWeight: 1.0,
  strongThreshold: 0.22,
  mediumThreshold: 0.12,
  marketWeights: {
    moneyline: { homeAdv: 0.05, pitcher: 0.4, batting: 0.2, bullpen: 0.25, recent: 0.1 },
    spread: { homeAdv: 0.03, pitcher: 0.25, batting: 0.35, bullpen: 0.2, recent: 0.17 },
    total: { homeAdv: 0.01, pitcher: 0.2, batting: 0.45, bullpen: 0.1, recent: 0.24 },
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const suggestedWeights = body?.suggestedWeights;

    if (!suggestedWeights) {
      return NextResponse.json({ ok: false, error: "suggestedWeights required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("settings_json")
      .eq("settings_key", "betlab_core")
      .maybeSingle();

    const merged = {
      ...DEFAULT_SETTINGS,
      ...(data?.settings_json ?? {}),
      marketWeights: suggestedWeights,
    };

    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          settings_key: "betlab_core",
          settings_json: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "settings_key" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "apply failed" },
      { status: 500 }
    );
  }
}
