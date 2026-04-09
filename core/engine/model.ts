import { DEFAULT_CONFIG, type BetlabConfig } from '@/core/config/defaults';

export type PitcherStats = { era?: number; whip?: number; inningsPitched?: number } | null;
export type BattingStats = { avg?: number; ops?: number; runs?: number; gamesPlayed?: number } | null;
export type RecentForm = { winPct?: number; runsForPerGame?: number; runsAgainstPerGame?: number } | null;
export type BullpenStats = { era?: number; whip?: number } | null;

export type EngineGameInput = {
  homeOdds: number;
  awayOdds: number;
  homePitcherStats: PitcherStats;
  awayPitcherStats: PitcherStats;
  homeBatStats: BattingStats;
  awayBatStats: BattingStats;
  homeRecentForm: RecentForm;
  awayRecentForm: RecentForm;
  homeBullpenStats: BullpenStats;
  awayBullpenStats: BullpenStats;
  parkAdj: number;
  homeLineupAdj?: number;
  awayLineupAdj?: number;
  totalLine?: number | null;
  spreadHomePoint?: number | null;
  spreadAwayPoint?: number | null;
  config?: BetlabConfig;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function fairProbabilities(homeOdds: number, awayOdds: number) {
  const rawHome = 1 / homeOdds;
  const rawAway = 1 / awayOdds;
  const total = rawHome + rawAway;
  return { fairHome: rawHome / total, fairAway: rawAway / total };
}

export function pitcherScore(stats: PitcherStats) {
  if (!stats) return 50;
  let score = 50;
  if ((stats.inningsPitched ?? 0) < 10) score -= 3;
  else if ((stats.inningsPitched ?? 0) >= 30) score += 3;
  if ((stats.era ?? 0) > 0) {
    if ((stats.era ?? 0) < 3.0) score += 12;
    else if ((stats.era ?? 0) < 4.0) score += 6;
    else if ((stats.era ?? 0) >= 5.0) score -= 8;
  }
  if ((stats.whip ?? 0) > 0) {
    if ((stats.whip ?? 0) < 1.1) score += 10;
    else if ((stats.whip ?? 0) < 1.25) score += 5;
    else if ((stats.whip ?? 0) >= 1.35) score -= 8;
  }
  return clamp(score, 20, 80);
}

export function battingScore(stats: BattingStats) {
  if (!stats) return 50;
  let score = 50;
  const runsPerGame = (stats.gamesPlayed ?? 0) > 0 ? (stats.runs ?? 0) / (stats.gamesPlayed ?? 1) : 0;
  if ((stats.ops ?? 0) > 0) {
    if ((stats.ops ?? 0) >= 0.78) score += 12;
    else if ((stats.ops ?? 0) >= 0.74) score += 7;
    else if ((stats.ops ?? 0) >= 0.7) score += 2;
    else score -= 8;
  }
  if ((stats.avg ?? 0) > 0) {
    if ((stats.avg ?? 0) >= 0.27) score += 6;
    else if ((stats.avg ?? 0) >= 0.25) score += 2;
    else score -= 4;
  }
  if (runsPerGame > 0) {
    if (runsPerGame >= 5.0) score += 8;
    else if (runsPerGame >= 4.3) score += 4;
    else if (runsPerGame < 3.8) score -= 6;
  }
  return clamp(score, 20, 80);
}

export function formScore(form: RecentForm) {
  if (!form) return 50;
  let score = 50;
  if ((form.winPct ?? 0) >= 0.7) score += 12;
  else if ((form.winPct ?? 0) >= 0.6) score += 7;
  else if ((form.winPct ?? 0) >= 0.5) score += 2;
  else if ((form.winPct ?? 0) < 0.4) score -= 8;
  if ((form.runsForPerGame ?? 0) >= 5.2) score += 6;
  else if ((form.runsForPerGame ?? 0) >= 4.4) score += 3;
  else if ((form.runsForPerGame ?? 0) < 3.8) score -= 5;
  if ((form.runsAgainstPerGame ?? 0) <= 3.6) score += 6;
  else if ((form.runsAgainstPerGame ?? 0) <= 4.2) score += 2;
  else if ((form.runsAgainstPerGame ?? 0) > 5.0) score -= 6;
  return clamp(score, 20, 80);
}

export function bullpenScore(stats: BullpenStats) {
  if (!stats) return 50;
  let score = 50;
  if ((stats.era ?? 0) > 0) {
    if ((stats.era ?? 0) < 3.5) score += 10;
    else if ((stats.era ?? 0) < 4.2) score += 5;
    else if ((stats.era ?? 0) >= 4.8) score -= 8;
  }
  if ((stats.whip ?? 0) > 0) {
    if ((stats.whip ?? 0) < 1.2) score += 8;
    else if ((stats.whip ?? 0) < 1.32) score += 4;
    else if ((stats.whip ?? 0) >= 1.4) score -= 6;
  }
  return clamp(score, 20, 80);
}

export function parkScore(venueName?: string | null) {
  const hitterParks = ['Coors Field', 'Great American Ball Park'];
  const pitcherParks = ['Oracle Park', 'Tropicana Field', 'T-Mobile Park'];
  if (!venueName) return 0;
  if (hitterParks.includes(venueName)) return 2;
  if (pitcherParks.includes(venueName)) return -2;
  return 0;
}

export function modelProbabilities(input: EngineGameInput) {
  const config = input.config ?? DEFAULT_CONFIG;
  const { fairHome, fairAway } = fairProbabilities(input.homeOdds, input.awayOdds);
  let homeProb = fairHome + config.homeAdvantage;
  let awayProb = fairAway - config.homeAdvantage;

  const w = config.weights;
  const pitcherGap = pitcherScore(input.homePitcherStats) - pitcherScore(input.awayPitcherStats);
  const formGap = formScore(input.homeRecentForm) - formScore(input.awayRecentForm);
  const battingGap = battingScore(input.homeBatStats) - battingScore(input.awayBatStats);
  const bullpenGap = bullpenScore(input.homeBullpenStats) - bullpenScore(input.awayBullpenStats);
  const lineupGap = (input.homeLineupAdj ?? 0) - (input.awayLineupAdj ?? 0);

  homeProb += pitcherGap * w.pitcher;
  awayProb -= pitcherGap * w.pitcher;
  homeProb += formGap * w.form;
  awayProb -= formGap * w.form;
  homeProb += battingGap * w.batting;
  awayProb -= battingGap * w.batting;
  homeProb += bullpenGap * w.bullpen;
  awayProb -= bullpenGap * w.bullpen;
  homeProb += input.parkAdj * w.park;
  awayProb -= input.parkAdj * w.park;
  homeProb += lineupGap * w.lineup;
  awayProb -= lineupGap * w.lineup;

  homeProb = clamp(homeProb, 0.05, 0.95);
  awayProb = clamp(awayProb, 0.05, 0.95);
  const total = homeProb + awayProb;
  return { homeProb: homeProb / total, awayProb: awayProb / total };
}

export function offenseFactor(config: BetlabConfig, batStats: BattingStats, batScore: number, recentForm: RecentForm, lineupAdj: number) {
  const seasonRuns = (batStats?.gamesPlayed ?? 0) > 0 ? (batStats?.runs ?? 0) / (batStats?.gamesPlayed ?? 1) : config.scoring.baseRuns;
  const seasonOps = batStats?.ops ?? 0.72;
  const recentRuns = recentForm?.runsForPerGame ?? seasonRuns;
  let factor = 1.0;
  factor += (seasonRuns - config.scoring.baseRuns) * 0.07;
  factor += (recentRuns - seasonRuns) * 0.08;
  factor += (seasonOps - 0.72) * 0.9;
  factor += (batScore - 50) * 0.006;
  factor += lineupAdj * 0.014;
  return clamp(factor, 0.68, 1.38);
}

export function preventionFactor(config: BetlabConfig, pitcherStats: PitcherStats, pitcherScoreValue: number, bullpenStats: BullpenStats, bullpenScoreValue: number, recentForm: RecentForm) {
  const pitcherEra = pitcherStats?.era ?? 4.2;
  const pitcherWhip = pitcherStats?.whip ?? 1.3;
  const bullpenEra = bullpenStats?.era ?? 4.2;
  const bullpenWhip = bullpenStats?.whip ?? 1.3;
  const recentRunsAllowed = recentForm?.runsAgainstPerGame ?? config.scoring.baseRuns;
  let prevention = 1.0;
  prevention -= (4.2 - pitcherEra) * 0.055;
  prevention -= (1.3 - pitcherWhip) * 0.16;
  prevention -= (pitcherScoreValue - 50) * 0.005;
  prevention -= (4.2 - bullpenEra) * 0.028;
  prevention -= (1.3 - bullpenWhip) * 0.08;
  prevention -= (bullpenScoreValue - 50) * 0.0035;
  prevention -= (config.scoring.baseRuns - recentRunsAllowed) * 0.03;
  return clamp(prevention, 0.72, 1.34);
}

export function expectedRuns(config: BetlabConfig, args: {
  batStats: BattingStats;
  batScore: number;
  recentForm: RecentForm;
  lineupAdj: number;
  opponentPitcherStats: PitcherStats;
  opponentPitcherScore: number;
  opponentBullpenStats: BullpenStats;
  opponentBullpenScore: number;
  opponentRecentForm: RecentForm;
  parkAdj: number;
  isHome: boolean;
}) {
  let runs = config.scoring.baseRuns;
  runs *= offenseFactor(config, args.batStats, args.batScore, args.recentForm, args.lineupAdj);
  runs *= preventionFactor(config, args.opponentPitcherStats, args.opponentPitcherScore, args.opponentBullpenStats, args.opponentBullpenScore, args.opponentRecentForm);
  runs += args.parkAdj * config.scoring.parkRunFactor;
  runs += args.isHome ? config.scoring.homeBonus : config.scoring.awayPenalty;
  return clamp(Number(runs.toFixed(2)), 2.0, 8.8);
}

export function handicapProbability(expectedMargin: number, linePoint: number, marginSd: number, isHomeSide: boolean) {
  const sideMargin = isHomeSide ? expectedMargin : -expectedMargin;
  const z = (sideMargin + linePoint) / Math.max(0.8, marginSd);
  return clamp(logistic(z * 1.55), 0.06, 0.94);
}

export function totalProbability(expectedTotal: number, totalLine: number, totalSd: number, isOver: boolean) {
  const z = (expectedTotal - totalLine) / Math.max(0.9, totalSd);
  const overProb = clamp(logistic(z * 1.45), 0.06, 0.94);
  return isOver ? overProb : 1 - overProb;
}

export function bbScore(prob: number, odds: number) {
  return prob * odds - 1;
}

export function analyzeGame(input: EngineGameInput) {
  const config = input.config ?? DEFAULT_CONFIG;
  const probs = modelProbabilities(input);
  const homeBatScore = battingScore(input.homeBatStats);
  const awayBatScore = battingScore(input.awayBatStats);
  const homePitcherScore = pitcherScore(input.homePitcherStats);
  const awayPitcherScore = pitcherScore(input.awayPitcherStats);
  const homeBullpenScore = bullpenScore(input.homeBullpenStats);
  const awayBullpenScore = bullpenScore(input.awayBullpenStats);

  const expectedHomeRuns = expectedRuns(config, {
    batStats: input.homeBatStats,
    batScore: homeBatScore,
    recentForm: input.homeRecentForm,
    lineupAdj: input.homeLineupAdj ?? 0,
    opponentPitcherStats: input.awayPitcherStats,
    opponentPitcherScore: awayPitcherScore,
    opponentBullpenStats: input.awayBullpenStats,
    opponentBullpenScore: awayBullpenScore,
    opponentRecentForm: input.awayRecentForm,
    parkAdj: input.parkAdj,
    isHome: true
  });

  const expectedAwayRuns = expectedRuns(config, {
    batStats: input.awayBatStats,
    batScore: awayBatScore,
    recentForm: input.awayRecentForm,
    lineupAdj: input.awayLineupAdj ?? 0,
    opponentPitcherStats: input.homePitcherStats,
    opponentPitcherScore: homePitcherScore,
    opponentBullpenStats: input.homeBullpenStats,
    opponentBullpenScore: homeBullpenScore,
    opponentRecentForm: input.homeRecentForm,
    parkAdj: input.parkAdj,
    isHome: false
  });

  const expectedMargin = Number((expectedHomeRuns - expectedAwayRuns).toFixed(2));
  const expectedTotal = Number((expectedHomeRuns + expectedAwayRuns).toFixed(2));
  const moneyline = {
    homeProb: probs.homeProb,
    awayProb: probs.awayProb,
    homeBB: bbScore(probs.homeProb, input.homeOdds),
    awayBB: bbScore(probs.awayProb, input.awayOdds),
    recommendation: probs.homeProb >= probs.awayProb ? 'HOME' : 'AWAY'
  };

  const spread = input.spreadHomePoint != null && input.spreadAwayPoint != null
    ? {
        homePoint: input.spreadHomePoint,
        awayPoint: input.spreadAwayPoint,
        homeProb: handicapProbability(expectedMargin, input.spreadHomePoint, 2.6, true),
        awayProb: handicapProbability(expectedMargin, input.spreadAwayPoint, 2.6, false)
      }
    : null;

  const total = input.totalLine != null
    ? {
        line: input.totalLine,
        overProb: totalProbability(expectedTotal, input.totalLine, 2.9, true),
        underProb: totalProbability(expectedTotal, input.totalLine, 2.9, false)
      }
    : null;

  const spreadWithBb = spread
    ? {
        ...spread,
        homeBB: bbScore(spread.homeProb, 1.91),
        awayBB: bbScore(spread.awayProb, 1.91),
        recommendation: spread.homeProb >= spread.awayProb ? 'HOME' : 'AWAY'
      }
    : null;

  const totalWithBb = total
    ? {
        ...total,
        overBB: bbScore(total.overProb, 1.91),
        underBB: bbScore(total.underProb, 1.91),
        recommendation: total.overProb >= total.underProb ? 'OVER' : 'UNDER'
      }
    : null;

  return {
    expectedHomeRuns,
    expectedAwayRuns,
    expectedMargin,
    expectedTotal,
    moneyline,
    spread: spreadWithBb,
    total: totalWithBb
  };
}
