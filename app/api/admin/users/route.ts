import { NextResponse } from "next/server";
import { getAdminUsers } from "@/lib/db/queries";

export async function GET() {
  const users = await getAdminUsers();
  return NextResponse.json({ ok: true, users });
}
