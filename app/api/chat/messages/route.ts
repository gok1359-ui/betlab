import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body?.userId ?? "").trim();
    const userEmail = String(body?.userEmail ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!userId || !userEmail || !message) {
      return NextResponse.json({ ok: false, error: "login required" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    let nickname = userEmail;
    const { data: userRow } = await supabase
      .from("users")
      .select("nickname")
      .eq("id", userId)
      .single();

    if (userRow?.nickname) {
      nickname = userRow.nickname;
    }

    const { error } = await supabase.from("chat_messages").insert({
      user_id: userId,
      message,
      nickname,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "chat send failed" },
      { status: 500 }
    );
  }
}
