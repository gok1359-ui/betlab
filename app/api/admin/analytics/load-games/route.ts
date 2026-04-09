import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const date = String(body?.date ?? "").trim();

    if (!date) {
      return NextResponse.json({ ok: false, error: "date required" }, { status: 400 });
    }

    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`,
      { cache: "no-store" }
    );

    const json = await response.json().catch(() => null);

    if (!response.ok || !json) {
      return NextResponse.json({ ok: false, error: "mlb schedule fetch failed" }, { status: 500 });
    }

    const games = [];

    for (const day of json.dates ?? []) {
      for (const game of day.games ?? []) {
        games.push({
          id: String(game.gamePk),
          gamePk: Number(game.gamePk),
          gameDate: String(game.gameDate ?? "").slice(0, 10),
          homeTeam: game?.teams?.home?.team?.name ?? "",
          awayTeam: game?.teams?.away?.team?.name ?? "",
        });
      }
    }

    return NextResponse.json({ ok: true, games });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "load games failed" },
      { status: 500 }
    );
  }
}
