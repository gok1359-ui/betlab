
'use client';
import { useState } from "react";
import { getCurrentUser } from "@/lib/auth/session";

export default function PointBetPanel({ gamePk, gameDate, homeTeam, awayTeam }) {
  const [pickSide, setPickSide] = useState("홈");
  const [points, setPoints] = useState("100");

  async function submitBet(e) {
    e.preventDefault();

    const user = await getCurrentUser();
    if (!user) {
      alert("로그인 필요");
      return;
    }

    await fetch("/api/points/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        gamePk,
        gameDate,
        homeTeam,
        awayTeam,
        betType: "moneyline",
        pickSide,
        points: Number(points),
      }),
    });

    alert("배팅 완료");
  }

  return (
    <form onSubmit={submitBet}>
      <h3>포인트 배팅</h3>

      <select onChange={(e) => setPickSide(e.target.value)}>
        <option value="홈">홈</option>
        <option value="원정">원정</option>
      </select>

      <input value={points} onChange={(e) => setPoints(e.target.value)} />

      <button type="submit">배팅하기</button>
    </form>
  );
}
