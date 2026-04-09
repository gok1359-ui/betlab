"use client";

import { useEffect, useState } from "react";

type AutomationRun = {
  id: string;
  runType: string;
  analyzedCount: number;
  savedAnalysesCount: number;
  verificationSavedCount: number;
  settlementSettledCount: number;
  settlementAffectedUsers: number;
  status: string;
  message: string;
  createdAt: string;
};

function fmtRunType(value: string) {
  if (value === "cron") return "자동";
  if (value === "manual") return "수동";
  return value || "-";
}

function fmtStatus(value: string) {
  if (value === "success") return "성공";
  if (value === "failed") return "실패";
  return value || "-";
}

export default function AdminAutomationPage() {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRuns() {
    const res = await fetch("/api/admin/automation/list", { cache: "no-store" }).catch(() => null);
    const json = await res?.json().catch(() => ({ ok: false }));
    if (json?.ok) setRuns(json.runs ?? []);
  }

  async function runNow() {
    setRunning(true);
    setMessage("");

    const res = await fetch("/api/admin/automation/run-now", {
      method: "POST",
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({ ok: false, error: "unknown error" }));
    if (!json.ok) {
      setMessage(`수동 실행 실패: ${json.error ?? "unknown error"}`);
      setRunning(false);
      return;
    }

    setMessage("자동 운영 수동 실행 완료");
    setRunning(false);
    await loadRuns();
  }

  useEffect(() => {
    loadRuns();
  }, []);

  return (
    <main className="space-y-4">
      <div className="card">
        <div className="section-header">
          <h1 className="text-2xl font-bold">자동 운영</h1>
          <span>운영 스케줄 / 실행 로그</span>
        </div>

        <p className="mt-2 opacity-80">
          오늘 분석 저장, 최근 결과 입력, 자동 정산까지 한 번에 실행한다.
        </p>

        <div className="mt-4 grid-3">
          <div className="card-soft">
            <div className="text-sm opacity-70">권장 자동 스케줄</div>
            <div className="mt-2 font-semibold">30분마다 1회</div>
            <p className="mt-2 text-sm opacity-80">현재 Vercel cron 기준 기본 운영 모드</p>
          </div>

          <div className="card-soft">
            <div className="text-sm opacity-70">운영 흐름</div>
            <p className="mt-2 text-sm opacity-90">분석 저장 → 최근 결과 입력 → 자동 정산</p>
          </div>

          <div className="card-soft">
            <div className="text-sm opacity-70">배포 체크</div>
            <p className="mt-2 text-sm opacity-90">CRON_SECRET / Vercel 배포 / vercel.json 확인</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="button" style={{ width: "180px" }} onClick={runNow} disabled={running}>
            {running ? "실행 중..." : "지금 실행"}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm opacity-90">{message}</p> : null}
      </div>

      <div className="card">
        <div className="section-header">
          <h2>최근 실행 로그</h2>
          <span>{runs.length}건</span>
        </div>

        {runs.length === 0 ? (
          <p className="mt-3 opacity-80">아직 실행 로그가 없다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="card-soft">
                <div className="flex items-center justify-between gap-3">
                  <strong>{run.createdAt ? run.createdAt.slice(0, 16).replace("T", " ") : "-"}</strong>
                  <span className="badge">{fmtStatus(run.status)}</span>
                </div>
                <p className="mt-2 opacity-80">실행 종류: {fmtRunType(run.runType)}</p>
                <p className="mt-1 opacity-80">분석 {run.analyzedCount} / 저장 {run.savedAnalysesCount} / 검증 {run.verificationSavedCount}</p>
                <p className="mt-1 opacity-80">정산 {run.settlementSettledCount} / 반영 유저 {run.settlementAffectedUsers}</p>
                <p className="mt-1 opacity-70">{run.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
