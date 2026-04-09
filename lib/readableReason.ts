export function buildReadableReason(rawReason: string, recommendation: string, marketType?: string) {
  const reason = String(rawReason || "").trim();
  const market = marketType === "spread" ? "핸디캡" : marketType === "total" ? "언오버" : "머니라인";

  if (!reason) {
    return {
      summary: `${market} 기준으로 뚜렷한 우세 신호가 보여 현재 추천이 나온 경기다.`,
      detail: `${market} 기준 핵심 지표를 종합했을 때 현재 추천 방향이 상대적으로 유리하게 나타났다.`,
    };
  }

  const cleaned = reason
    .replace(/\s*\+\s*/g, " / ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const parts = cleaned
    .split(/[\/.]|\n/)
    .map((v) => v.trim())
    .filter(Boolean);

  const first = parts[0] || cleaned;

  let summary = "";
  if (recommendation.includes("홈")) {
    summary = `홈 쪽 핵심 지표가 더 안정적으로 잡혀 ${market} 기준 홈 방향 추천이 나온 경기다.`;
  } else if (recommendation.includes("원정")) {
    summary = `원정 쪽 핵심 지표가 더 우세해서 ${market} 기준 원정 방향 추천이 나온 경기다.`;
  } else if (recommendation.includes("오버")) {
    summary = `득점 기대치가 높게 잡혀 ${market} 기준 오버 성향이 강한 경기다.`;
  } else if (recommendation.includes("언더")) {
    summary = `실점 억제 쪽 신호가 더 강해서 ${market} 기준 언더 성향이 보이는 경기다.`;
  } else {
    summary = `${market} 기준으로 현재 추천 방향이 더 유리하게 계산된 경기다.`;
  }

  const detail = `${summary} 핵심 근거는 ${first}${parts.length > 1 ? `, 그리고 ${parts.slice(1, 3).join(", ")}` : ""} 쪽이다.`;

  return { summary, detail };
}
