'use client';

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth/session";

type WalletResponse = {
  ok: boolean;
  balance?: number;
  bets?: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    betType: string;
    pickSide: string;
    points: number;
    status: string;
    createdAt: string;
    payoutPoints?: number;
  }>;
};

export default function PointsPage() {
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [bets, setBets] = useState<WalletResponse["bets"]>([]);
  const [message, setMessage] = useState("");
  const [settling, setSettling] = useState(false);

  async function loadData() {
    const user = await getCurrentUser();
    if (!user) {
      setChecked(true);
      setLoggedIn(false);
      return;
    }

    setLoggedIn(true);

    const res = await fetch(`/api/points/bet?userId=${encodeURIComponent(user.id)}`);
    const json: WalletResponse = await res.json().catch(() => ({ ok: false }));

    if (json.ok) {
      setBalance(json.balance ?? 0);
      setBets(json.bets ?? []);
    }

    setChecked(true);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function settleNow() {
    const user = await getCurrentUser();
    if (!user) {
      setMessage("로그인 후 사용 가능");
      return;
    }

    setSettling(true);
    setMessage("");

    const res = await fetch("/api/points/settle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`정산 실패: ${json.error ?? "unknown error"}`);
      setSettling(false);
      return;
    }

    setMessage(`정산 완료 · ${json.settledCount}건 처리 · 현재 잔액 ${json.balance}P`);
    await loadData();
    setSettling(false);
  }

  if (!checked) {
    return <main className="card">포인트 정보 불러오는 중...</main>;
  }

  if (!loggedIn) {
    return (
      <main className="space-y-4">
        <div className="card">
          <h1 className="text-2xl font-bold">포인트배팅</h1>
          <p className="mt-2 opacity-80">로그인 후 포인트 정보 확인 가능</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <div className="section-header">
          <h1 className="text-2xl font-bold">포인트배팅</h1>
          <button
            className="button"
            style={{ width: "160px" }}
            onClick={settleNow}
            disabled={settling}
          >
            {settling ? "정산중..." : "결과 정산"}
          </button>
        </div>
        <p className="mt-2 opacity-80">현재 보유 포인트: <strong>{balance}P</strong></p>
        <p className="mt-2 text-sm opacity-70">1차 버전은 머니라인만 자동 정산</p>
        {message ? <p className="mt-3 text-sm opacity-90">{message}</p> : null}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold">내 배팅 기록</h2>
        {bets && bets.length > 0 ? (
          <div className="mt-4 space-y-3">
            {bets.map((bet) => (
              <div key={bet.id} className="card">
                <strong>{bet.awayTeam} @ {bet.homeTeam}</strong>
                <p className="mt-2 opacity-80">{bet.betType} · {bet.pickSide} · {bet.points}P</p>
                <p className="mt-1 opacity-60">상태: {bet.status}</p>
                {"payoutPoints" in bet ? (
                  <p className="mt-1 opacity-60">정산 포인트: {bet.payoutPoints ?? 0}P</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 opacity-80">아직 배팅 기록이 없다.</p>
        )}
      </div>
    </main>
  );
}
