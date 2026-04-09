import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, predictions: [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return NextResponse.json({ ok: true, received: body });
}
