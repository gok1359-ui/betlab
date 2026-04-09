import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RankingRow = {
  id: string;
  nickname: string;
  points: number;
};

function normalizePoints(row: any) {
  const value =
    row?.points ??
    row?.point_balance ??
    row?.balance ??
    row?.total_points ??
    0;

  return Number(value ?? 0);
}

export async function getRankings(limit = 30): Promise<RankingRow[]> {
  const supabase = createSupabaseServerClient();

  const candidates = [
    { table: "user_points", select: "id, nickname, points" },
    { table: "profiles", select: "id, nickname, point_balance" },
    { table: "users", select: "id, nickname, points" },
  ];

  for (const candidate of candidates) {
    const query = await supabase
      .from(candidate.table)
      .select(candidate.select)
      .limit(limit);

    if (!query.error && query.data) {
      const rows = query.data
        .map((row: any) => ({
          id: String(row.id ?? Math.random()),
          nickname: String(row.nickname ?? "이름없음"),
          points: normalizePoints(row),
        }))
        .sort((a, b) => b.points - a.points);

      if (rows.length > 0) return rows;
    }
  }

  return [];
}

export async function getHomeRankingsPreview(): Promise<RankingRow[]> {
  const rows = await getRankings(5);
  return rows.slice(0, 3);
}
