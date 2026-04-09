'use client';

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser, signOutUser } from "@/lib/auth/session";

type SessionUser = {
  id: string;
  email: string;
};

type LoginLookupResponse = {
  ok: boolean;
  email?: string;
  error?: string;
};

export default function HomeLoginPanel() {
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/login-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username.trim() }),
    });

    const json: LoginLookupResponse = await res.json().catch(() => ({ ok: false, error: "lookup failed" }));

    if (!json.ok || !json.email) {
      setMessage("아이디 또는 비밀번호를 확인해줘.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: json.email,
      password,
    });

    if (error) {
      setMessage("아이디 또는 비밀번호를 확인해줘.");
      return;
    }

    const nextUser = await getCurrentUser();
    setUser(nextUser);
    setUsername("");
    setPassword("");
    setMessage("");
    window.location.reload();
  }

  async function handleLogout() {
    await signOutUser();
    setUser(null);
    setMessage("");
    window.location.reload();
  }

  if (!checked) {
    return <div className="side-panel login-panel">로그인 상태 확인 중...</div>;
  }

  if (user) {
    return (
      <div className="side-panel login-panel">
        <div className="side-panel-title">계정</div>
        <div className="login-user-box">
          <div className="login-user-label">로그인됨</div>
          <div className="login-user-email">{user.email}</div>
        </div>

        <button className="panel-button primary" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="side-panel login-panel">
      <div className="side-panel-title">로그인</div>

      <form className="side-login-form" onSubmit={handleLogin}>
        <input
          className="side-input"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="side-input"
          placeholder="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="panel-button primary" type="submit">
          로그인
        </button>
      </form>

      <div className="side-login-links">
        <span>이메일 인증 없이 바로 사용</span>
        <a href="/signup">회원가입</a>
      </div>

      {message ? <p className="side-message">{message}</p> : null}
    </div>
  );
}
