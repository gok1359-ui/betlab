import { NextResponse } from "next/server";

function enumerateDates(startDate: string, endDate: string) {
  const result: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return result;

  const current = new Date(start);
  while (current <= end) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const startDate = String(body?.startDate ?? "").trim();
    const endDate = String(body?.endDate ?? "").trim();

    if (!startDate || !endDate) {
      return NextResponse.json({ ok: false, error: "startDate and endDate required" }, { status: 400 });
    }

    const dates = enumerateDates(startDate, endDate);
    if (!dates.length) {
      return NextResponse.json({ ok: false, error: "invalid range" }, { status: 400 });
    }

    const games: any[] = [];

    for (const date of dates) {
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`,
        { cache: "no-store" }
      );
      const json = await response.json().catch(() => null);
      if (!response.ok || !json) continue;

      for (const day of json.dates ?? []) {
        for (const game of day.games ?? []) {
          games.push({
            id: `${game.gamePk}-${date}`,
            gamePk: Number(game.gamePk),
            gameDate: date,
            homeTeam: game?.teams?.home?.team?.name ?? "",
            awayTeam: game?.teams?.away?.team?.name ?? "",
          });
        }
      }
    }

    return NextResponse.json({ ok: true, games });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "range load failed" },
      { status: 500 }
    );
  }
}
