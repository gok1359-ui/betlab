export type ConfigLike = {
  homeAdvantage: number;
  bbThreshold: { strong: number; weak: number };
  scoring: {
    baseRuns: number;
    homeBonus: number;
    awayPenalty: number;
    parkRunFactor: number;
  };
  weights: {
    pitcher: number;
    form: number;
    batting: number;
    bullpen: number;
    lineup: number;
    park: number;
  };
};

export type SavedAnalysisLike = {
  id: string;
  date: string;
  result?: {
    bbBreakdown?: Record<string, number>;
  };
};

export type VerificationLike = {
  analysisId: string;
  result: 'win' | 'loss' | 'push';
};

type FactorKey = 'pitcher' | 'form' | 'batting' | 'bullpen' | 'lineup' | 'park';

const FACTOR_LABEL: Record<FactorKey, string> = {
  pitcher: '선발',
  form: '최근 흐름',
  batting: '타격',
  bullpen: '불펜',
  lineup: '라인업',
  park: '구장',
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildRecommendedSettings(
  currentConfig: ConfigLike,
  savedAnalyses: SavedAnalysisLike[],
  verification: VerificationLike[],
  opts?: { date?: string; startDate?: string; endDate?: string }
) {
  const vmap = new Map(verification.map((v) => [v.analysisId, v.result]));
  const losses = savedAnalyses.filter((item) => {
    if (opts?.date && item.date !== opts.date) return false;
    if (opts?.startDate && item.date < opts.startDate) return false;
    if (opts?.endDate && item.date > opts.endDate) return false;
    return vmap.get(item.id) === 'loss';
  });

  const factors: FactorKey[] = ['pitcher', 'form', 'batting', 'bullpen', 'lineup', 'park'];
  const factorAbsSum: Record<FactorKey, number> = {
    pitcher: 0, form: 0, batting: 0, bullpen: 0, lineup: 0, park: 0,
  };
  const factorTopCount: Record<FactorKey, number> = {
    pitcher: 0, form: 0, batting: 0, bullpen: 0, lineup: 0, park: 0,
  };

  for (const item of losses) {
    const bb = item.result?.bbBreakdown ?? {};
    let topKey: FactorKey | null = null;
    let topAbs = -1;

    for (const key of factors) {
      const value = Math.abs(Number(bb[key] ?? 0));
      factorAbsSum[key] += value;
      if (value > topAbs) {
        topAbs = value;
        topKey = key;
      }
    }

    if (topKey) factorTopCount[topKey] += 1;
  }

  const lossCount = losses.length || 1;
  const factorAvg: Record<FactorKey, number> = {
    pitcher: factorAbsSum.pitcher / lossCount,
    form: factorAbsSum.form / lossCount,
    batting: factorAbsSum.batting / lossCount,
    bullpen: factorAbsSum.bullpen / lossCount,
    lineup: factorAbsSum.lineup / lossCount,
    park: factorAbsSum.park / lossCount,
  };

  const nextWeights = { ...currentConfig.weights };
  const notes: string[] = [];

  if (losses.length >= 3) {
    if (factorAvg.bullpen >= 0.16 || factorTopCount.bullpen >= Math.ceil(losses.length * 0.35)) {
      nextWeights.bullpen = clamp(round2(currentConfig.weights.bullpen - 0.02), 0.04, 0.18);
      notes.push(`오답 경기에서 ${FACTOR_LABEL.bullpen} 영향이 자주 크게 나타나서 가중치를 소폭 낮춤`);
    }

    if (factorAvg.park >= 0.07 || factorTopCount.park >= Math.ceil(losses.length * 0.25)) {
      nextWeights.park = clamp(round2(currentConfig.weights.park - 0.01), 0.01, 0.08);
      notes.push(`오답 경기에서 ${FACTOR_LABEL.park} 영향이 과하게 튀어서 가중치를 더 낮춤`);
    }

    if (factorAvg.pitcher <= 0.12 && currentConfig.weights.pitcher < 0.45) {
      nextWeights.pitcher = clamp(round2(currentConfig.weights.pitcher + 0.02), 0.2, 0.5);
      notes.push(`${FACTOR_LABEL.pitcher} 설명력이 상대적으로 약해서 가중치를 소폭 높임`);
    }

    if (factorAvg.batting <= 0.12 && currentConfig.weights.batting < 0.35) {
      nextWeights.batting = clamp(round2(currentConfig.weights.batting + 0.02), 0.16, 0.38);
      notes.push(`${FACTOR_LABEL.batting} 설명력이 상대적으로 약해서 가중치를 소폭 높임`);
    }
  }

  const targetTotal =
    nextWeights.pitcher +
    nextWeights.form +
    nextWeights.batting +
    nextWeights.bullpen +
    nextWeights.lineup +
    nextWeights.park;

  if (targetTotal !== 0) {
    const sourceTotal =
      currentConfig.weights.pitcher +
      currentConfig.weights.form +
      currentConfig.weights.batting +
      currentConfig.weights.bullpen +
      currentConfig.weights.lineup +
      currentConfig.weights.park;

    const scale = sourceTotal / targetTotal;

    for (const key of factors) {
      nextWeights[key] = round2(clamp(nextWeights[key] * scale, 0.01, 0.5));
    }
  }

  if (!notes.length) {
    notes.push('아직 범위 내 오답 데이터가 충분하지 않아 현재 설정 유지 추천');
  }

  return {
    basedOnLosses: losses.length,
    factorAvg,
    factorTopCount,
    recommended: {
      ...currentConfig,
      weights: nextWeights,
    },
    notes,
  };
}
