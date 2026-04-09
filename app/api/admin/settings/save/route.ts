import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          settings_key: "betlab_core",
          settings_json: settings,
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
      { ok: false, error: error instanceof Error ? error.message : "save settings failed" },
      { status: 500 }
    );
  }
}
