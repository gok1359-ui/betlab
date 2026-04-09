
export function applyMarketWeights(baseScore, weights, marketType) {
  const w = weights[marketType] || weights.default;

  return (
    baseScore.homeAdv * w.homeAdv +
    baseScore.pitcher * w.pitcher +
    baseScore.batting * w.batting +
    baseScore.bullpen * w.bullpen +
    baseScore.recent * w.recent
  );
}
