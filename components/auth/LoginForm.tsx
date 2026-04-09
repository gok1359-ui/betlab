"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type LoginLookupResponse = {
  ok?: boolean;
  email?: string;
  error?: string;
};

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Supabase 브라우저 설정이 없다.");
  }

  return createClient(url, anon);
}

function isEmailLike(value: string) {
  return value.includes("@");
}

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const disabled = useMemo(() => {
    return loading || !identifier.trim() || !password.trim();
  }, [identifier, password, loading]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let email = identifier.trim();

      if (!isEmailLike(email)) {
        const lookupResponse = await fetch("/api/auth/login-lookup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            username: identifier.trim(),
            loginId: identifier.trim(),
          }),
        });

        const lookupJson = (await lookupResponse.json().catch(() => ({}))) as LoginLookupResponse;

        if (lookupResponse.ok && lookupJson?.email) {
          email = String(lookupJson.email);
        } else {
          throw new Error(lookupJson?.error || "아이디에 연결된 계정을 찾지 못했다.");
        }
      }

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim(),
      });

      if (error) {
        throw new Error(error.message || "로그인에 실패했다.");
      }

      if (!data?.user) {
        throw new Error("로그인 사용자 정보를 확인하지 못했다.");
      }

      await fetch("/api/auth/sync-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          identifier: identifier.trim(),
          username: identifier.trim(),
        }),
      }).catch(() => null);

      setSuccessMessage("로그인 성공. 홈으로 이동한다.");
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ maxWidth: 620, margin: "0 auto" }}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="card-soft">
          <label className="block">
            <div className="text-sm font-bold text-white/70">아이디</div>
            <input
              className="input mt-3"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="아이디 입력"
              autoComplete="username"
            />
          </label>
        </div>

        <div className="card-soft">
          <label className="block">
            <div className="text-sm font-bold text-white/70">비밀번호</div>
            <input
              className="input mt-3"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
            />
          </label>
        </div>

        {errorMessage ? (
          <div
            className="card-soft"
            style={{
              borderColor: "rgba(248,113,113,0.28)",
              boxShadow: "0 0 0 1px rgba(248,113,113,0.08) inset",
            }}
          >
            <div className="text-sm font-bold text-rose-300">{errorMessage}</div>
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="card-soft"
            style={{
              borderColor: "rgba(34,197,94,0.28)",
              boxShadow: "0 0 0 1px rgba(34,197,94,0.08) inset",
            }}
          >
            <div className="text-sm font-bold text-emerald-300">{successMessage}</div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <button className="button" disabled={disabled} type="submit" style={{ minWidth: 140 }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
          <Link href="/signup" className="button-secondary" style={{ minWidth: 140 }}>
            회원가입
          </Link>
        </div>
      </form>
    </section>
  );
}
