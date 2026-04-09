export function buildBBReason(
  bbBreakdown?: Record<string, number> | null
) {
  if (!bbBreakdown) return "데이터 부족";

  const labelMap: Record<string, string> = {
    pitcher: "선발",
    batting: "타격",
    bullpen: "불펜",
    form: "최근 흐름",
    lineup: "라인업",
    park: "구장",
  };

  const entries = Object.entries(bbBreakdown)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  if (!entries.length) return "특이 요소 없음";

  const top = entries.slice(0, 3);
  const positives = top.filter((e) => e.value > 0.03).map((e) => labelMap[e.key] ?? e.key);
  const negatives = top.filter((e) => e.value < -0.03).map((e) => labelMap[e.key] ?? e.key);

  let text = "";

  if (positives.length) {
    text += `${positives.join(" + ")} 우위`;
  }

  if (negatives.length) {
    if (text) text += " / ";
    text += `${negatives.join(" + ")} 열세`;
  }

  return text || "특이 요소 없음";
}
