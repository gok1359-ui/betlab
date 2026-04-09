'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`로그인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user) {
      await fetch("/api/auth/sync-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data.user.id,
          email: data.user.email ?? email,
          nickname: (data.user.user_metadata?.nickname as string | undefined) ?? "user",
        }),
      }).catch(() => null);
    }

    setMessage("로그인 성공");
    router.push("/my-picks");
    router.refresh();
    setLoading(false);
  }

  return (
    <form className="card space-y-3" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">로그인</h2>
      <input
        className="input"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      <input
        className="input"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
      />
      <button className="button" type="submit" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
      {message ? <p className="text-sm opacity-80">{message}</p> : null}
    </form>
  );
}
