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
};

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_settings")
      .select("settings_json")
      .eq("settings_key", "betlab_core")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      settings: data?.settings_json ?? DEFAULT_SETTINGS,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "load settings failed" },
      { status: 500 }
    );
  }
}
