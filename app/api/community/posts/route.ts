import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, title, content, author_nickname, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, posts: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const userId = String(body?.userId ?? "").trim();
    const userEmail = String(body?.userEmail ?? "").trim();

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: "title and content are required" },
        { status: 400 }
      );
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { ok: false, error: "login required" },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    let authorNickname = userEmail;
    const { data: userRow } = await supabase
      .from("users")
      .select("nickname")
      .eq("id", userId)
      .single();

    if (userRow?.nickname) {
      authorNickname = userRow.nickname;
    }

    const { error } = await supabase.from("community_posts").insert({
      user_id: userId,
      title,
      content,
      author_nickname: authorNickname,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "post create failed" },
      { status: 500 }
    );
  }
}
