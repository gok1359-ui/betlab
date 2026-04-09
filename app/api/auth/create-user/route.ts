import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildInternalEmail(username: string) {
  return `${username}@betlab.local`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const name = String(body?.name ?? "").trim();
    const nickname = String(body?.nickname ?? "").trim();
    const contactEmail = String(body?.email ?? "").trim();

    if (!username || !password || !name || !nickname || !contactEmail) {
      return NextResponse.json({ ok: false, error: "필수 항목이 비어있다." }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
      return NextResponse.json({ ok: false, error: "아이디 형식이 올바르지 않다." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ ok: false, error: "이미 사용 중인 아이디다." }, { status: 409 });
    }

    const authEmail = buildInternalEmail(username);

    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        nickname,
        name,
        contact_email: contactEmail,
      },
    });

    if (authError || !created.user) {
      return NextResponse.json({ ok: false, error: authError?.message ?? "auth 생성 실패" }, { status: 500 });
    }

    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: created.user.id,
        username,
        email: authEmail,
        contact_email: contactEmail,
        name,
        nickname,
        role: "user",
        status: "active",
        last_login_at: null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "회원가입 실패" },
      { status: 500 }
    );
  }
}
