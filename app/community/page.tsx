import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CommunityPage() {
  const supabase = createSupabaseServerClient();
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, title, content, author_nickname, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="section-header">
          <div>
            <div className="text-sm font-black tracking-[0.16em] text-cyan-200/80">COMMUNITY BOARD</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">커뮤니티</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 betlab-muted">
              자유글, 경기 토론, 분석 공유를 한곳에서 운영하는 BetLab 통합 게시판.
            </p>
          </div>
          <Link href="/login" className="button">글쓰기</Link>
        </div>
      </section>

      {!posts || posts.length === 0 ? (
        <section className="card">
          <p className="betlab-muted">아직 등록된 글이 없다.</p>
        </section>
      ) : (
        <section className="grid-2">
          {posts.map((post: any) => (
            <article key={post.id} className="card">
              <div className="section-header">
                <strong className="text-2xl font-black tracking-[-0.04em] text-white">
                  {post.title || "제목 없음"}
                </strong>
                <span className="badge">{post.author_nickname || "익명"}</span>
              </div>

              <p className="mt-4 text-[15px] leading-7 text-white/85">
                {post.content || ""}
              </p>

              <div className="mt-5 text-sm font-semibold text-white/55">
                {String(post.created_at ?? "").slice(0, 16).replace("T", " ")}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
