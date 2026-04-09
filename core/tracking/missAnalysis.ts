export type VerificationLike = {
  analysisId: string;
  result: 'win' | 'loss' | 'push';
  checkedAt: string;
};

export type SavedAnalysisLike = {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  summary: string;
  bbValue: number;
  marketType: 'moneyline' | 'spread' | 'total';
  snapshot: {
    expectedHomeRuns: number;
    expectedAwayRuns: number;
    expectedMargin: number;
    expectedTotal: number;
  };
  oddsSummary: {
    totalLine: number | null;
    spreadHomePoint: number | null;
    spreadAwayPoint: number | null;
  };
  result?: any;
};

function abs(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.abs(v) : 0;
}

function getBreakdown(result: any) {
  return result?.bbBreakdown ?? result?.breakdown ?? null;
}

function getTopReason(result: any) {
  const bb = getBreakdown(result);
  if (!bb) return '구성요소 데이터 없음';

  const labelMap: Record<string, string> = {
    pitcher: '선발',
    batting: '타격',
    bullpen: '불펜',
    form: '최근 흐름',
    lineup: '라인업',
    park: '구장',
  };

  const top = Object.entries(bb)
    .map(([key, value]) => ({ key, value: Number(value) || 0 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  if (!top) return '구성요소 데이터 없음';
  return `${labelMap[top.key] ?? top.key} 과대/과소평가 가능성`;
}

export function buildMissAnalysis(
  savedAnalyses: SavedAnalysisLike[],
  verification: VerificationLike[],
  opts?: { date?: string }
) {
  const vmap = new Map(verification.map((v) => [v.analysisId, v]));
  const filtered = savedAnalyses.filter((item) => !opts?.date || item.date === opts.date);

  const misses = filtered
    .map((item) => {
      const verdict = vmap.get(item.id);
      if (!verdict || verdict.result !== 'loss') return null;

      const breakdown = getBreakdown(item.result);
      const biggest = breakdown
        ? Object.entries(breakdown)
            .map(([key, value]) => ({ key, value: Number(value) || 0 }))
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
        : null;

      return {
        id: item.id,
        date: item.date,
        matchup: `${item.awayTeam} @ ${item.homeTeam}`,
        summary: item.summary,
        marketType: item.marketType,
        bbValue: item.bbValue,
        checkedAt: verdict.checkedAt,
        likelyReason: getTopReason(item.result),
        biggestFactor: biggest ? `${biggest.key} ${biggest.value > 0 ? '+' : ''}${biggest.value.toFixed(2)}` : '-',
        expectedScore: `${item.snapshot.expectedAwayRuns} : ${item.snapshot.expectedHomeRuns}`,
        expectedTotal: item.snapshot.expectedTotal,
      };
    })
    .filter(Boolean);

  const total = filtered.length;
  const lossCount = misses.length;
  const highBbMisses = misses.filter((m: any) => abs(m.bbValue) >= 0.2).length;

  return {
    totalTracked: total,
    lossCount,
    highBbMisses,
    misses,
  };
}
