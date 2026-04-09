import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PendingBet = {
  id: string;
  user_id: string;
  game_pk: number;
  game_date: string | null;
  bet_type: string;
  pick_side: string;
  points: number;
  status: string;
};

type ResultRow = {
  gamePk: number;
  isFinal: boolean;
  homeScore: number;
  awayScore: number;
};

function evaluateMoneyline(
  pickSide: string,
  result: ResultRow
): "win" | "loss" | "push" {
  if (result.homeScore === result.awayScore) return "push";

  const homeWon = result.homeScore > result.awayScore;
  if (pickSide === "홈") return homeWon ? "win" : "loss";
  if (pickSide === "원정") return homeWon ? "loss" : "win";
  return "loss";
}

async function runSettlementForBets(origin: string, pendingBets: PendingBet[]) {
  const supabase = createSupabaseServerClient();

  if (!pendingBets.length) {
    return { settledCount: 0, payoutByUser: new Map<string, number>() };
  }

  const uniqueDates = [
    ...new Set(
      pendingBets
        .map((bet) => String(bet.game_date ?? "").slice(0, 10))
        .filter(Boolean)
    ),
  ];

  const resultMap = new Map<number, ResultRow>();

  for (const date of uniqueDates) {
    const response = await fetch(
      `${origin}/api/mlb/results?date=${encodeURIComponent(date)}`,
      { cache: "no-store" }
    );

    const json = await response.json().catch(() => ({ ok: false }));

    if (!json.ok || !Array.isArray(json.results)) continue;

    for (const row of json.results) {
      resultMap.set(Number(row.gamePk), {
        gamePk: Number(row.gamePk),
        isFinal: Boolean(row.isFinal),
        homeScore: Number(row.homeScore ?? 0),
        awayScore: Number(row.awayScore ?? 0),
      });
    }
  }

  let settledCount = 0;
  const payoutByUser = new Map<string, number>();

  for (const bet of pendingBets) {
    if (bet.bet_type !== "moneyline") continue;

    const result = resultMap.get(Number(bet.game_pk));
    if (!result || !result.isFinal) continue;

    const points = Number(bet.points ?? 0);
    const outcome = evaluateMoneyline(String(bet.pick_side ?? ""), result);

    let payoutPoints = 0;
    if (outcome === "win") payoutPoints = Math.round(points * 1.9 * 100) / 100;
    if (outcome === "push") payoutPoints = points;

    const { error: updateBetError } = await supabase
      .from("point_bets")
      .update({
        status: outcome,
        payout_points: payoutPoints,
        settled_at: new Date().toISOString(),
      })
      .eq("id", bet.id);

    if (updateBetError) {
      throw new Error(updateBetError.message);
    }

    payoutByUser.set(
      bet.user_id,
      Number(payoutByUser.get(bet.user_id) ?? 0) + payoutPoints
    );
    settledCount += 1;
  }

  for (const [userId, payout] of payoutByUser.entries()) {
    const { data: wallet, error: walletError } = await supabase
      .from("point_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      throw new Error("wallet not found");
    }

    const nextBalance = Number(wallet.balance ?? 0) + Number(payout ?? 0);

    const { error: walletUpdateError } = await supabase
      .from("point_wallets")
      .update({
        balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (walletUpdateError) {
      throw new Error(walletUpdateError.message);
    }
  }

  return { settledCount, payoutByUser };
}

async function settleSingleUser(userId: string, origin: string) {
  const supabase = createSupabaseServerClient();

  const { data: pendingBets, error: pendingError } = await supabase
    .from("point_bets")
    .select("id, user_id, game_pk, game_date, bet_type, pick_side, points, status")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  const { settledCount, payoutByUser } = await runSettlementForBets(
    origin,
    (pendingBets ?? []) as PendingBet[]
  );

  const { data: refreshedWallet } = await supabase
    .from("point_wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  return {
    settledCount,
    payout: Number(payoutByUser.get(userId) ?? 0),
    balance: Number(refreshedWallet?.balance ?? 0),
  };
}

async function settleAllUsers(origin: string) {
  const supabase = createSupabaseServerClient();

  const { data: pendingBets, error: pendingError } = await supabase
    .from("point_bets")
    .select("id, user_id, game_pk, game_date, bet_type, pick_side, points, status")
    .eq("status", "pending");

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  const { settledCount, payoutByUser } = await runSettlementForBets(
    origin,
    (pendingBets ?? []) as PendingBet[]
  );

  return {
    settledCount,
    affectedUsers: payoutByUser.size,
  };
}

function isAuthorizedCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json(
        { ok: false, error: "unauthorized cron" },
        { status: 401 }
      );
    }

    const origin = new URL(request.url).origin;
    const result = await settleAllUsers(origin);

    return NextResponse.json({
      ok: true,
      mode: "cron",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "cron settlement failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body?.userId ?? "").trim();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "userId required" },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const result = await settleSingleUser(userId, origin);

    return NextResponse.json({
      ok: true,
      mode: "manual",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "manual settlement failed",
      },
      { status: 500 }
    );
  }
}
