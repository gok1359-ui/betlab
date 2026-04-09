'use client';

import { useState } from "react";

type LoadedGame = {
  id: string;
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
};

type AnalysisResult = {
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  bbValue: number;
  reason: string;
};

export default function AdminAnalyticsPage() {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [games, setGames] = useState<LoadedGame[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [message, setMessage] = useState("");

  async function loadGames() {
    setLoadingGames(true);
    setMessage("");

    const res = await fetch("/api/admin/analytics/load-games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date: targetDate }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`경기 불러오기 실패: ${json.error ?? "unknown error"}`);
      setLoadingGames(false);
      return;
    }

    setGames(json.games ?? []);
    setResults([]);
    setMessage(`경기 ${json.games?.length ?? 0}건 불러오기 완료`);
    setLoadingGames(false);
  }

  async function runAnalysis() {
    if (!games.length) {
      setMessage("먼저 경기를 불러와야 한다.");
      return;
    }

    setRunningAnalysis(true);
    setMessage("");

    const res = await fetch("/api/admin/analytics/run-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ games }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`분석 실행 실패: ${json.error ?? "unknown error"}`);
      setRunningAnalysis(false);
      return;
    }

    setResults(json.results ?? []);
    setMessage(`분석 ${json.results?.length ?? 0}건 완료`);
    setRunningAnalysis(false);
  }

  async function saveResults() {
    if (!results.length) {
      setMessage("저장할 분석 결과가 없다.");
      return;
    }

    setSavingResults(true);
    setMessage("");

    const res = await fetch("/api/admin/analytics/save-results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ results }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`저장 실패: ${json.error ?? "unknown error"}`);
      setSavingResults(false);
      return;
    }

    setMessage(`분석 결과 ${json.savedCount ?? 0}건 저장 완료`);
    setSavingResults(false);
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">관리자 분석툴</h1>
        <p className="mt-2 opacity-80">오늘 경기 불러오기, 분석 실행, 저장까지 하는 2차 대시보드.</p>
      </div>

      <div className="card space-y-4">
        <div className="section-header">
          <h2>분석 실행</h2>
          <span>저장 포함</span>
        </div>

        <div className="grid-2">
          <label className="space-y-2">
            <span>대상 날짜</span>
            <input
              className="input"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <span>작업</span>
            <div className="flex gap-2">
              <button className="button" style={{ width: "160px" }} onClick={loadGames} disabled={loadingGames}>
                {loadingGames ? "불러오는 중..." : "경기 불러오기"}
              </button>
              <button className="button" style={{ width: "160px" }} onClick={runAnalysis} disabled={runningAnalysis}>
                {runningAnalysis ? "분석 중..." : "분석 실행"}
              </button>
              <button className="button" style={{ width: "160px" }} onClick={saveResults} disabled={savingResults}>
                {savingResults ? "저장 중..." : "분석 저장"}
              </button>
            </div>
          </div>
        </div>

        {message ? <p className="text-sm opacity-90">{message}</p> : null}
      </div>

      <div className="card">
        <div className="section-header">
          <h2>분석 결과</h2>
          <span>{results.length}건</span>
        </div>

        {results.length === 0 ? (
          <p className="mt-3 opacity-80">아직 분석 결과가 없다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {results.map((result) => (
              <div key={`${result.gamePk}-${result.recommendation}`} className="card">
                <div className="flex items-center justify-between gap-3">
                  <strong>{result.awayTeam} @ {result.homeTeam}</strong>
                  <span className="badge">{result.recommendation}</span>
                </div>
                <p className="mt-2 opacity-80">BB점수 {result.bbValue.toFixed(2)}</p>
                <p className="mt-1 opacity-70">{result.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
