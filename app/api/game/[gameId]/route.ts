import { NextResponse } from "next/server";
import { getPublicGame } from "@/lib/db/queries";

export async function GET(_: Request, context: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await context.params;
  const game = await getPublicGame(gameId);

  if (!game) {
    return NextResponse.json({ ok: false, error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, game });
}
