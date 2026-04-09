import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const nickname = String(body?.nickname ?? "user").trim() || "user";

    if (!id || !email) {
      return NextResponse.json(
        { ok: false, error: "id and email are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from("users").upsert(
      {
        id,
        email,
        nickname,
        role: "user",
        status: "active",
        last_login_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "sync login failed",
      },
      { status: 500 }
    );
  }
}
