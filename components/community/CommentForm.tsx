'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

type Props = {
  postId: string;
};

type SessionUser = {
  id: string;
  email: string;
};

export default function CommentForm({ postId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((nextUser) => {
        setUser(nextUser);
        setChecked(true);
      })
      .catch(() => {
        setUser(null);
        setChecked(true);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("로그인 후 댓글 작성이 가능하다.");
      return;
    }

    if (!content.trim()) {
      setMessage("댓글 내용을 입력해줘.");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/community/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
        content: content.trim(),
        userId: user.id,
        userEmail: user.email,
      }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`댓글 등록 실패: ${json.error ?? "unknown error"}`);
      setLoading(false);
      return;
    }

    setContent("");
    router.refresh();
    setLoading(false);
  }

  if (!checked) {
    return <div className="card">로그인 상태 확인 중...</div>;
  }

  if (!user) {
    return (
      <div className="card space-y-3">
        <p>로그인 후 댓글 작성이 가능하다.</p>
        <button className="button" onClick={() => router.push("/login")}>
          로그인
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="text-lg font-bold">댓글 작성</h3>
      <textarea
        className="input"
        style={{ height: "120px", paddingTop: "12px" }}
        placeholder="댓글 내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button className="button" disabled={loading}>
        {loading ? "등록 중..." : "댓글 등록"}
      </button>
      {message ? <p className="text-sm opacity-80">{message}</p> : null}
    </form>
  );
}
