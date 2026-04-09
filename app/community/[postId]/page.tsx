import { notFound } from "next/navigation";
import CommentForm from "@/components/community/CommentForm";
import { getCommunityComments, getCommunityPost } from "@/lib/db/community";

export default async function CommunityPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getCommunityPost(postId);

  if (!post) {
    notFound();
  }

  const comments = await getCommunityComments(postId);

  return (
    <main className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <div className="mt-2 text-sm opacity-60">{post.authorNickname} · {post.createdAt}</div>
        <p className="mt-4 whitespace-pre-wrap">{post.content}</p>
      </div>

      <CommentForm postId={postId} />

      <div className="card">
        <h2 className="text-lg font-bold">댓글</h2>
        {comments.length === 0 ? (
          <p className="mt-3 opacity-80">아직 댓글이 없다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <strong>{comment.authorNickname}</strong>
                  <span className="text-xs opacity-60">{comment.createdAt}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
