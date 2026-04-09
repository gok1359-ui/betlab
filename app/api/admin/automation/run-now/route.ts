import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "CRON_SECRET missing" }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const response = await fetch(`${origin}/api/cron/run`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({ ok: false }));
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: json.error ?? "run-now failed" }, { status: response.status });
    }

    return NextResponse.json({ ok: true, result: json });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "run-now failed" },
      { status: 500 }
    );
  }
}
