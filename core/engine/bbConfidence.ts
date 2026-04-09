
/*
PATCH: BB Confidence System 추가
- bbBreakdown 기반 신뢰도 계산
*/

export function computeBBConfidence(bbBreakdown) {
  if (!bbBreakdown) return { score: 0, label: "낮음" };

  const values = Object.values(bbBreakdown).map(v => Math.abs(v));

  const total = values.reduce((a, b) => a + b, 0);

  const activeFactors = values.filter(v => v > 0.05).length;

  const maxFactor = Math.max(...values, 0);

  let score = 0;

  // 분산 기반 (여러 요소 관여하면 점수 ↑)
  score += activeFactors * 0.2;

  // 총 영향도
  score += total * 0.3;

  // 특정 요소 과도 집중이면 감점
  if (maxFactor > total * 0.7) {
    score -= 0.3;
  }

  // clamp
  score = Math.max(0, Math.min(score, 1));

  let label = "낮음";
  if (score > 0.7) label = "높음";
  else if (score > 0.4) label = "중간";

  return {
    score: Number(score.toFixed(2)),
    label
  };
}
