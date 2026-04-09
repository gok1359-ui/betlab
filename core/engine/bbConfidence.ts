/**
 * BB breakdown 기반 confidence score 계산
 */

type BBBreakdown = Record<string, number | null | undefined> | null | undefined;

type BBConfidenceResult = {
  score: number;
  label: "낮음" | "보통" | "높음";
};

export function computeBBConfidence(bbBreakdown: BBBreakdown): BBConfidenceResult {
  if (!bbBreakdown) return { score: 0, label: "낮음" };

  const values = Object.values(bbBreakdown)
    .map((v) => Math.abs(Number(v ?? 0)))
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) {
    return { score: 0, label: "낮음" };
  }

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  if (avg >= 0.2) return { score: avg, label: "높음" };
  if (avg >= 0.1) return { score: avg, label: "보통" };
  return { score: avg, label: "낮음" };
}
