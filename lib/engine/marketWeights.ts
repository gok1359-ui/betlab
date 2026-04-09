type BaseScore = {
  homeAdv: number;
  pitcher: number;
  batting: number;
  bullpen: number;
  recent: number;
};

type MarketWeightRow = {
  homeAdv: number;
  pitcher: number;
  batting: number;
  bullpen: number;
  recent: number;
};

type MarketWeights = {
  default: MarketWeightRow;
  moneyline?: MarketWeightRow;
  spread?: MarketWeightRow;
  total?: MarketWeightRow;
  [key: string]: MarketWeightRow | undefined;
};

export function applyMarketWeights(
  baseScore: BaseScore,
  weights: MarketWeights,
  marketType: string
): number {
  const w = weights[marketType] || weights.default;

  if (!w) {
    return (
      baseScore.homeAdv +
      baseScore.pitcher +
      baseScore.batting +
      baseScore.bullpen +
      baseScore.recent
    );
  }

  return (
    baseScore.homeAdv * w.homeAdv +
    baseScore.pitcher * w.pitcher +
    baseScore.batting * w.batting +
    baseScore.bullpen * w.bullpen +
    baseScore.recent * w.recent
  );
}