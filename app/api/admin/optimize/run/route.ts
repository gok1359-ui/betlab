import { NextResponse } from "next/server";
import { runOptimizer } from "@/lib/db/optimizer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const startDate = String(body?.startDate ?? "").trim();
    const endDate = String(body?.endDate ?? "").trim();

    if (!startDate || !endDate) {
      return NextResponse.json({ ok: false, error: "startDate and endDate required" }, { status: 400 });
    }

    const result = await runOptimizer(startDate, endDate);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "optimizer failed" },
      { status: 500 }
    );
  }
}
