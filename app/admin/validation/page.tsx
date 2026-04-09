import { getJoinedValidationRows, getValidationSummary } from "@/lib/db/adminValidation";

export default async function ValidationPage() {
  const summary = await getValidationSummary();
  const rows = await getJoinedValidationRows();

  return (
    <main className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">검증 탭</h1>
        <p className="mt-2 opacity-80">저장된 분석 결과와 검증 결과를 합쳐서 보여주는 실제 데이터 버전.</p>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="text-sm opacity-70">검증 완료</div>
          <div className="mt-2 text-2xl font-bold">{summary.total}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">적중률</div>
          <div className="mt-2 text-2xl font-bold">{(summary.hitRate * 100).toFixed(1)}%</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">고BB 적중률</div>
          <div className="mt-2 text-2xl font-bold">{(summary.highBbRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h2>검증 목록</h2>
          <span>{rows.length}건</span>
        </div>

        {rows.length === 0 ? (
          <p className="mt-3 opacity-80">저장된 분석이나 검증 데이터가 없다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <strong>{row.match}</strong>
                  <span className="badge">{row.result}</span>
                </div>
                <p className="mt-2 opacity-80">{row.recommendation}</p>
                <p className="mt-1 opacity-70">BB {row.bb.toFixed(2)} · {row.marketType}</p>
                <p className="mt-1 opacity-60">{row.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
