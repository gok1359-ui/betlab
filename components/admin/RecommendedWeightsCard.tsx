export default function RecommendedWeightsCard() {
  return (
    <div className="card">
      <div className="section-header">
        <h2>추천 영향도 방향</h2>
        <span>검증 기반 가이드</span>
      </div>

      <div className="grid-3 mt-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <strong>머니라인</strong>
          <p className="mt-2 opacity-80">선발 ↑ / 불펜 ↑ / 타격 보조</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <strong>핸디캡</strong>
          <p className="mt-2 opacity-80">타격 ↑ / 최근 폼 ↑ / 선발 보조</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <strong>언오버</strong>
          <p className="mt-2 opacity-80">타격 ↑ / 최근 폼 ↑ / 홈 효과 낮게</p>
        </div>
      </div>
    </div>
  );
}
