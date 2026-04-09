import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();

    if (!username) {
      return NextResponse.json({ ok: false, error: "username required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("username", username)
      .single();

    if (error || !data?.email) {
      return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, email: data.email });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "lookup failed" },
      { status: 500 }
    );
  }
}
