import { NextResponse } from "next/server";
import { getJoinedValidationRows, getValidationSummary } from "@/lib/db/adminValidation";

export async function GET() {
  const summary = await getValidationSummary();
  const rows = await getJoinedValidationRows();
  return NextResponse.json({ ok: true, summary, rows });
}
