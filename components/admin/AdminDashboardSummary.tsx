import { getAdminDashboardStats } from "@/lib/db/adminDashboardStats";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function AdminDashboardSummary() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-4">
      <div className="grid-3">
        <div className="card">
          <div className="text-sm opacity-70">전체 분석 수</div>
          <div className="mt-2 text-2xl font-bold">{stats.totalAnalyses}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">검증 완료 수</div>
          <div className="mt-2 text-2xl font-bold">{stats.validatedCount}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">전체 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.totalHitRate)}</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="text-sm opacity-70">머니라인 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.moneylineHitRate)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">핸디캡 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.spreadHitRate)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">언오버 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.totalMarketHitRate)}</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="text-sm opacity-70">최근 7일 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.recent7HitRate)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">강추천 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.strongPickHitRate)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">고BB 적중률</div>
          <div className="mt-2 text-2xl font-bold">{pct(stats.bbHighHitRate)}</div>
        </div>
      </div>
    </div>
  );
}
