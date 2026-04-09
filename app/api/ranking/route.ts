import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("point_wallets")
    .select("user_id, balance, users(nickname)")
    .order("balance", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({
    ok: true,
    ranking: data,
  });
}