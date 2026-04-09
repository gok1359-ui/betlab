import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CommunityPost = {
  id: string;
  title: string;
  content: string;
  authorNickname: string;
  createdAt: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  content: string;
  authorNickname: string;
  createdAt: string;
};

type PostRow = {
  id: string;
  title: string;
  content: string;
  author_nickname: string | null;
  created_at: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  content: string;
  author_nickname: string | null;
  created_at: string;
};

function mapPost(row: PostRow): CommunityPost {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    authorNickname: row.author_nickname ?? "익명",
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    authorNickname: row.author_nickname ?? "익명",
    createdAt: row.created_at,
  };
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, title, content, author_nickname, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getCommunityPosts]", error.message);
    return [];
  }

  return (data ?? []).map(mapPost);
}

export async function getCommunityPost(postId: string): Promise<CommunityPost | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, title, content, author_nickname, created_at")
    .eq("id", postId)
    .single();

  if (error) {
    console.error("[getCommunityPost]", error.message);
    return null;
  }

  return data ? mapPost(data) : null;
}

export async function getCommunityComments(postId: string): Promise<CommunityComment[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, post_id, content, author_nickname, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getCommunityComments]", error.message);
    return [];
  }

  return (data ?? []).map(mapComment);
}
