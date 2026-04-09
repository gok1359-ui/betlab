"use client";

import { useState } from "react";

type PointBetPanelProps = {
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
};

export default function PointBetPanel({
  gamePk,
  gameDate,
  homeTeam,
  awayTeam,
}: PointBetPanelProps) {
  const [pickSide, setPickSide] = useState<string>("홈");
  const [points, setPoints] = useState<string>("100");

  async function handleSubmit() {
    try {
      const response = await fetch("/api/points/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gamePk,
          gameDate,
          homeTeam,
          awayTeam,
          pickSide,
          points: Number(points || 0),
        }),
      });

      const json = await response.json().catch(() => ({ ok: false }));
      if (!response.ok || !json?.ok) {
        alert(json?.error || "포인트 배팅 저장 실패");
        return;
      }

      alert("포인트 배팅이 저장됐다.");
    } catch {
      alert("포인트 배팅 처리 중 오류가 발생했다.");
    }
  }

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="text-2xl font-bold">포인트 배팅</h2>
        <span className="badge">시뮬레이션</span>
      </div>

      <div className="mt-4 grid-2">
        <div className="card-soft">
          <div className="text-sm opacity-70">선택</div>
          <div className="mt-3 flex gap-2">
            <button
              className={pickSide === "홈" ? "button" : "button-secondary"}
              onClick={() => setPickSide("홈")}
              type="button"
            >
              홈
            </button>
            <button
              className={pickSide === "원정" ? "button" : "button-secondary"}
              onClick={() => setPickSide("원정")}
              type="button"
            >
              원정
            </button>
          </div>
        </div>

        <div className="card-soft">
          <div className="text-sm opacity-70">포인트</div>
          <input
            className="input mt-3"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            inputMode="numeric"
            placeholder="100"
          />
        </div>
      </div>

      <div className="mt-4 text-sm opacity-80">
        경기: {awayTeam} vs {homeTeam} / 날짜: {gameDate} / 게임PK: {gamePk}
      </div>

      <div className="mt-4">
        <button className="button" onClick={handleSubmit} type="button">
          포인트 배팅 저장
        </button>
      </div>
    </div>
  );
}
