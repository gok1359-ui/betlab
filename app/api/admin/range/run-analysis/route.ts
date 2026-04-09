import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const games = Array.isArray(body?.games) ? body.games : [];

    if (!games.length) {
      return NextResponse.json({ ok: false, error: "games required" }, { status: 400 });
    }

    const results = games.map((game: any, index: number) => {
      const mode = index % 3;
      const bbValue = mode === 0 ? 0.27 : mode === 1 ? 0.18 : 0.10;
      const recommendation =
        mode === 0 ? "머니라인 홈 강추천" :
        mode === 1 ? "머니라인 원정 중추천" :
        "관찰";

      const reason =
        mode === 0 ? "선발 우위 + 불펜 우위" :
        mode === 1 ? "시장 대비 원정 가치" :
        "근거 약함";

      return {
        gamePk: Number(game.gamePk),
        gameDate: String(game.gameDate ?? ""),
        homeTeam: String(game.homeTeam ?? ""),
        awayTeam: String(game.awayTeam ?? ""),
        recommendation,
        bbValue,
        reason,
      };
    });

    const strongCount = results.filter((row) => row.bbValue >= 0.22).length;
    const mediumCount = results.filter((row) => row.bbValue >= 0.12 && row.bbValue < 0.22).length;
    const avgBb = results.length
      ? results.reduce((sum, row) => sum + Number(row.bbValue ?? 0), 0) / results.length
      : 0;

    return NextResponse.json({
      ok: true,
      results,
      summary: {
        totalGames: results.length,
        strongCount,
        mediumCount,
        avgBb,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "range analysis failed" },
      { status: 500 }
    );
  }
}
