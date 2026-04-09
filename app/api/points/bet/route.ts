import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBetsByUserId, getWalletByUserId } from "@/lib/db/points";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = String(searchParams.get("userId") ?? "").trim();

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  }

  const wallet = await getWalletByUserId(userId);
  const bets = await getBetsByUserId(userId);

  return NextResponse.json({
    ok: true,
    balance: wallet?.balance ?? 0,
    bets,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = String(body?.userId ?? "").trim();
    const gamePk = Number(body?.gamePk ?? 0);
    const homeTeam = String(body?.homeTeam ?? "").trim();
    const awayTeam = String(body?.awayTeam ?? "").trim();
    const betType = String(body?.betType ?? "").trim();
    const pickSide = String(body?.pickSide ?? "").trim();
    const points = Number(body?.points ?? 0);

    if (!userId || !gamePk || !homeTeam || !awayTeam || !betType || !pickSide || !Number.isFinite(points)) {
      return NextResponse.json({ ok: false, error: "required values missing" }, { status: 400 });
    }

    if (points <= 0) {
      return NextResponse.json({ ok: false, error: "포인트는 1 이상이어야 한다." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data: existingWallet, error: walletError } = await supabase
      .from("point_wallets")
      .select("user_id, balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !existingWallet) {
      return NextResponse.json({ ok: false, error: "포인트 지갑이 없다." }, { status: 404 });
    }

    const currentBalance = Number(existingWallet.balance ?? 0);
    if (currentBalance < points) {
      return NextResponse.json({ ok: false, error: "포인트가 부족하다." }, { status: 400 });
    }

    const nextBalance = currentBalance - points;

    const { error: updateError } = await supabase
      .from("point_wallets")
      .update({
        balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    const { error: insertError } = await supabase
      .from("point_bets")
      .insert({
        user_id: userId,
        game_pk: gamePk,
        home_team: homeTeam,
        away_team: awayTeam,
        bet_type: betType,
        pick_side: pickSide,
        points,
        status: "pending",
      });

    if (insertError) {
      await supabase
        .from("point_wallets")
        .update({
          balance: currentBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, balance: nextBalance });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "bet failed" },
      { status: 500 }
    );
  }
}
