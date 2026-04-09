import { NextResponse } from "next/server";
import { getPublicGames } from "@/lib/db/queries";

export async function GET() {
  const games = await getPublicGames();
  return NextResponse.json({ ok: true, games });
}
