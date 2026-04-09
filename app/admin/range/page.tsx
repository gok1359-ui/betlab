'use client';

import { useState } from "react";

type RangeGame = {
  id: string;
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
};

type RangeResult = {
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  bbValue: number;
  reason: string;
  marketType?: string;
  result?: string;
};

type Summary = {
  totalGames: number;
  strongCount: number;
  mediumCount: number;
  avgBb: number;
  validatedCount?: number;
  winCount?: number;
  lossCount?: number;
  hitRate?: number;
};

export default function AdminRangePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [games, setGames] = useState<RangeGame[]>([]);
  const [results, setResults] = useState<RangeResult[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [validationRows, setValidationRows] = useState<RangeResult[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRangeGames() {
    setLoadingGames(true);
    setMessage("");
    setResults([]);
    setSummary(null);
    setValidationRows([]);

    const res = await fetch("/api/admin/range/load-games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`범위 경기 불러오기 실패: ${json.error ?? "unknown error"}`);
      setLoadingGames(false);
      return;
    }

    setGames(json.games ?? []);
    setMessage(`범위 경기 ${json.games?.length ?? 0}건 불러오기 완료`);
    setLoadingGames(false);
  }

  async function runRangeAnalysis() {
    if (!games.length) {
      setMessage("먼저 범위 경기를 불러와야 한다.");
      return;
    }

    setRunningAnalysis(true);
    setMessage("");

    const res = await fetch("/api/admin/range/run-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ games }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`범위 분석 실패: ${json.error ?? "unknown error"}`);
      setRunningAnalysis(false);
      return;
    }

    setResults(json.results ?? []);
    setSummary(json.summary ?? null);
    setMessage(`범위 분석 ${json.results?.length ?? 0}건 완료`);
    setRunningAnalysis(false);
  }

  async function saveRangeResults() {
    if (!results.length) {
      setMessage("저장할 범위 분석 결과가 없다.");
      return;
    }

    setSavingResults(true);
    setMessage("");

    const res = await fetch("/api/admin/range/save-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`범위 분석 저장 실패: ${json.error ?? "unknown error"}`);
      setSavingResults(false);
      return;
    }

    setMessage(`범위 분석 결과 ${json.savedCount ?? 0}건 저장 완료`);
    setSavingResults(false);
  }

  async function backfillHistoricalResults() {
    setBackfilling(true);
    setMessage("");

    const res = await fetch("/api/admin/verification/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`과거 결과 입력 실패: ${json.error ?? "unknown error"}`);
      setBackfilling(false);
      return;
    }

    setMessage(`과거 결과 입력 완료 · ${json.savedCount ?? 0}건 저장/갱신`);
    setBackfilling(false);
  }

  async function loadRangeValidation() {
    setLoadingValidation(true);
    setMessage("");

    const res = await fetch("/api/admin/range/validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));

    if (!json.ok) {
      setMessage(`범위 검증 불러오기 실패: ${json.error ?? "unknown error"}`);
      setLoadingValidation(false);
      return;
    }

    setValidationRows(json.rows ?? []);
    setSummary((prev) => ({
      ...(prev ?? { totalGames: 0, strongCount: 0, mediumCount: 0, avgBb: 0 }),
      validatedCount: Number(json.summary?.validatedCount ?? 0),
      winCount: Number(json.summary?.winCount ?? 0),
      lossCount: Number(json.summary?.lossCount ?? 0),
      hitRate: Number(json.summary?.hitRate ?? 0),
    }));
    setMessage(`범위 검증 ${json.rows?.length ?? 0}건 불러오기 완료`);
    setLoadingValidation(false);
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <div className="section-header">
          <h1 className="text-2xl font-bold">범위 분석 / 범위 검증</h1>
          <span>과거 결과 입력 포함</span>
        </div>
        <p className="mt-2 opacity-80">범위 분석 실행, 저장, 과거 경기 결과 입력, 실제 검증 데이터 연결.</p>
      </div>

      <div className="card">
        <div className="section-header">
          <h2>범위 설정</h2>
          <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
            <button className="button" style={{ width: "160px" }} onClick={loadRangeGames} disabled={loadingGames}>
              {loadingGames ? "불러오는 중..." : "범위 경기 불러오기"}
            </button>
            <button className="button" style={{ width: "160px" }} onClick={runRangeAnalysis} disabled={runningAnalysis}>
              {runningAnalysis ? "분석 중..." : "범위 분석 실행"}
            </button>
            <button className="button" style={{ width: "160px" }} onClick={saveRangeResults} disabled={savingResults}>
              {savingResults ? "저장 중..." : "범위 분석 저장"}
            </button>
            <button className="button" style={{ width: "160px" }} onClick={backfillHistoricalResults} disabled={backfilling}>
              {backfilling ? "입력 중..." : "과거 결과 입력"}
            </button>
            <button className="button" style={{ width: "160px" }} onClick={loadRangeValidation} disabled={loadingValidation}>
              {loadingValidation ? "검증 중..." : "범위 검증 불러오기"}
            </button>
          </div>
        </div>

        <div className="grid-2 mt-4">
          <label className="space-y-2">
            <span>시작일</span>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="space-y-2">
            <span>종료일</span>
            <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        {message ? <p className="mt-4 text-sm opacity-90">{message}</p> : null}
      </div>

      {summary ? (
        <div className="grid-3">
          <div className="card"><div className="text-sm opacity-70">총 경기수</div><div className="mt-2 text-2xl font-bold">{summary.totalGames}</div></div>
          <div className="card"><div className="text-sm opacity-70">강추천 수</div><div className="mt-2 text-2xl font-bold">{summary.strongCount}</div></div>
          <div className="card"><div className="text-sm opacity-70">평균 BB</div><div className="mt-2 text-2xl font-bold">{summary.avgBb.toFixed(2)}</div></div>
          <div className="card"><div className="text-sm opacity-70">검증 완료</div><div className="mt-2 text-2xl font-bold">{summary.validatedCount ?? 0}</div></div>
          <div className="card"><div className="text-sm opacity-70">적중 수</div><div className="mt-2 text-2xl font-bold">{summary.winCount ?? 0}</div></div>
          <div className="card"><div className="text-sm opacity-70">적중률</div><div className="mt-2 text-2xl font-bold">{(((summary.hitRate ?? 0) * 100)).toFixed(1)}%</div></div>
        </div>
      ) : null}

      <div className="card">
        <div className="section-header"><h2>범위 검증 결과</h2><span>{validationRows.length}건</span></div>
        {validationRows.length === 0 ? (
          <p className="mt-3 opacity-80">아직 범위 검증 결과가 없다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {validationRows.map((row) => (
              <div key={`${row.gamePk}-${row.gameDate}-${row.marketType}`} className="card">
                <div className="flex items-center justify-between gap-3">
                  <strong>{row.awayTeam} @ {row.homeTeam}</strong>
                  <span className="badge">{row.result}</span>
                </div>
                <p className="mt-2 opacity-80">{row.recommendation}</p>
                <p className="mt-1 opacity-70">{row.gameDate} · {row.marketType} · BB {row.bbValue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
