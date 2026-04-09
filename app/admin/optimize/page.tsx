"use client";

import { useState } from "react";

type WeightRow = {
  homeAdv: number;
  pitcher: number;
  batting: number;
  bullpen: number;
  recent: number;
};

type OptimizeResult = {
  inspectedCount: number;
  validatedCount: number;
  overallHitRate: number;
  byMarket: {
    moneyline: number;
    spread: number;
    total: number;
  };
  suggestedWeights: {
    moneyline: WeightRow;
    spread: WeightRow;
    total: WeightRow;
  };
};

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminOptimizePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);

  async function runOptimize() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/optimize/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));
    if (!json.ok) {
      setMessage(`최적화 실패: ${json.error ?? "unknown error"}`);
      setLoading(false);
      return;
    }
    setResult(json.result ?? null);
    setMessage("최적화 분석 완료");
    setLoading(false);
  }

  async function applySuggested() {
    if (!result?.suggestedWeights) {
      setMessage("적용할 추천값이 없다.");
      return;
    }
    setApplying(true);
    setMessage("");
    const res = await fetch("/api/admin/optimize/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestedWeights: result.suggestedWeights }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));
    if (!json.ok) {
      setMessage(`적용 실패: ${json.error ?? "unknown error"}`);
      setApplying(false);
      return;
    }
    setMessage("추천 영향도를 설정값에 반영 완료");
    setApplying(false);
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <div className="section-header">
          <h1 className="text-2xl font-bold">자동 영향도 최적화</h1>
          <span>1차</span>
        </div>
        <p className="mt-2 opacity-80">기간 검증 결과를 바탕으로 시장별 추천 영향도를 계산한다.</p>
      </div>

      <div className="card">
        <div className="grid-2">
          <label className="space-y-2">
            <span>시작일</span>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="space-y-2">
            <span>종료일</span>
            <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="button" style={{ width: "180px" }} onClick={runOptimize} disabled={loading}>
            {loading ? "분석 중..." : "최적화 실행"}
          </button>
          <button className="button" style={{ width: "180px" }} onClick={applySuggested} disabled={applying || !result}>
            {applying ? "적용 중..." : "추천값 설정 반영"}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm opacity-90">{message}</p> : null}
      </div>

      {result ? (
        <>
          <div className="grid-3">
            <div className="card">
              <div className="text-sm opacity-70">검사 경기 수</div>
              <div className="mt-2 text-2xl font-bold">{result.inspectedCount}</div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">검증 완료 수</div>
              <div className="mt-2 text-2xl font-bold">{result.validatedCount}</div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">전체 적중률</div>
              <div className="mt-2 text-2xl font-bold">{pct(result.overallHitRate)}</div>
            </div>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="text-sm opacity-70">머니라인 적중률</div>
              <div className="mt-2 text-2xl font-bold">{pct(result.byMarket.moneyline)}</div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">핸디캡 적중률</div>
              <div className="mt-2 text-2xl font-bold">{pct(result.byMarket.spread)}</div>
            </div>
            <div className="card">
              <div className="text-sm opacity-70">언오버 적중률</div>
              <div className="mt-2 text-2xl font-bold">{pct(result.byMarket.total)}</div>
            </div>
          </div>

          {(["moneyline", "spread", "total"] as const).map((market) => (
            <div key={market} className="card">
              <div className="section-header">
                <h2>{market.toUpperCase()} 추천 영향도</h2>
                <span>자동 계산</span>
              </div>
              <div className="grid-3 mt-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">홈 {result.suggestedWeights[market].homeAdv.toFixed(2)}</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">선발 {result.suggestedWeights[market].pitcher.toFixed(2)}</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">타격 {result.suggestedWeights[market].batting.toFixed(2)}</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">불펜 {result.suggestedWeights[market].bullpen.toFixed(2)}</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">최근폼 {result.suggestedWeights[market].recent.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </>
      ) : null}
    </main>
  );
}
