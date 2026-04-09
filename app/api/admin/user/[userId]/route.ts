import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/db/queries";

export async function GET(_: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const user = await getAdminUser(userId);

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const body = await request.json().catch(() => null);
  return NextResponse.json({ ok: true, userId, updated: body });
}
