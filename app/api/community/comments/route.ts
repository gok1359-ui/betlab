import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postId = String(body?.postId ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const userId = String(body?.userId ?? "").trim();
    const userEmail = String(body?.userEmail ?? "").trim();

    if (!postId || !content) {
      return NextResponse.json(
        { ok: false, error: "postId and content are required" },
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

    const { error } = await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: userId,
      content,
      author_nickname: authorNickname,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "comment create failed" },
      { status: 500 }
    );
  }
}
