import { NextResponse } from "next/server";
import { getAutomationRuns } from "@/lib/db/automation";

export async function GET() {
  const runs = await getAutomationRuns();
  return NextResponse.json({ ok: true, runs });
}
