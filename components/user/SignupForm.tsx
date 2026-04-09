'use client';

import { useState } from "react";

type CreateUserResponse = {
  ok: boolean;
  error?: string;
};

export default function SignupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!username.trim() || !password || !passwordConfirm || !name.trim() || !nickname.trim() || !email.trim()) {
      setMessage("모든 항목을 입력해줘.");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("비밀번호 확인이 일치하지 않는다.");
      return;
    }

    if (username.trim().length < 3) {
      setMessage("아이디는 최소 3자 이상이어야 한다.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
        name: name.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
      }),
    });

    const json: CreateUserResponse = await res.json().catch(() => ({ ok: false, error: "signup failed" }));

    if (!json.ok) {
      setMessage(json.error ?? "회원가입 실패");
      setLoading(false);
      return;
    }

    setMessage("회원가입 완료. 이제 아이디/비밀번호로 로그인하면 된다.");
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setNickname("");
    setEmail("");
    setLoading(false);
  }

  return (
    <form className="signup-card" onSubmit={handleSubmit}>
      <div className="signup-section-title">이용정보 입력</div>

      <div className="signup-grid two">
        <label className="signup-field">
          <span>아이디</span>
          <input className="signup-input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>

        <div className="signup-help">영문자, 숫자, _ 만 입력 가능. 최소 3자 이상 입력 가능</div>

        <label className="signup-field">
          <span>비밀번호</span>
          <input className="signup-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <label className="signup-field">
          <span>비밀번호 확인</span>
          <input className="signup-input" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
        </label>
      </div>

      <div className="signup-divider" />

      <div className="signup-section-title">개인정보 입력</div>

      <div className="signup-grid two">
        <label className="signup-field">
          <span>이름</span>
          <input className="signup-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div />

        <label className="signup-field">
          <span>닉네임</span>
          <input className="signup-input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>

        <div className="signup-help">공백없이 한글, 영문, 숫자만 가능</div>

        <label className="signup-field full">
          <span>E-mail</span>
          <input className="signup-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>

      {message ? <div className="signup-message">{message}</div> : null}

      <div className="signup-actions">
        <button type="button" className="signup-button ghost" onClick={() => window.history.back()}>
          취소
        </button>
        <button type="submit" className="signup-button primary" disabled={loading}>
          {loading ? "처리중..." : "회원가입"}
        </button>
      </div>
    </form>
  );
}
