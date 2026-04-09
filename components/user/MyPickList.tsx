'use client';

import { useEffect, useState } from "react";
import { getCurrentUser, signOutUser, type SessionUser } from "@/lib/auth/session";

export default function MyPickList() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    await signOutUser();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="card">세션 확인 중...</div>;
  }

  if (!user) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold">내 예측 기록</h2>
        <p className="mt-3 opacity-80">로그인 후 내 예측 기록을 볼 수 있어.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">내 예측 기록</h2>
        <button className="button" style={{ width: "auto", padding: "0 14px" }} onClick={handleLogout}>
          로그아웃
        </button>
      </div>
      <p className="mt-3 opacity-80">로그인 계정: {user.email}</p>
      <div className="mt-4 space-y-3">
        <div className="card">Dodgers vs Padres · 머니라인 홈 · 저장됨</div>
        <div className="card">Yankees vs Blue Jays · 오버 · 저장됨</div>
      </div>
    </div>
  );
}
