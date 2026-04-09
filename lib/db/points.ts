import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PointWallet = {
  userId: string;
  balance: number;
  updatedAt: string;
};

export type PointBet = {
  id: string;
  userId: string;
  gamePk: number;
  homeTeam: string;
  awayTeam: string;
  betType: "moneyline" | "spread" | "total";
  pickSide: string;
  points: number;
  status: "pending" | "win" | "loss" | "push";
  createdAt: string;
};

export async function getWalletByUserId(userId: string): Promise<PointWallet | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("point_wallets")
    .select("user_id, balance, updated_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    balance: Number(data.balance ?? 0),
    updatedAt: data.updated_at,
  };
}

export async function getBetsByUserId(userId: string): Promise<PointBet[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("point_bets")
    .select("id, user_id, game_pk, home_team, away_team, bet_type, pick_side, points, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    gamePk: Number(row.game_pk),
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    betType: row.bet_type,
    pickSide: row.pick_side,
    points: Number(row.points ?? 0),
    status: row.status,
    createdAt: row.created_at,
  }));
}
