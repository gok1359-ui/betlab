export type TeamSide = {
  team?: {
    id?: number;
    name?: string;
    clubName?: string;
    shortName?: string;
    abbreviation?: string;
  };
  probablePitcher?: {
    id?: number;
    fullName?: string;
  };
};

export type TeamProfile = {
  multiYearAttack: number;
  multiYearDefense: number;
  currentAttack: number;
  currentDefense: number;
  recentForm: number;
  bullpen: number;
  lineup: number;
  starter: number;
};

export type MlbGame = {
  gamePk?: number;
  gameDate?: string;
  officialDate?: string;
  status?: {
    detailedState?: string;
    abstractGameState?: string;
  };
  teams?: {
    away?: TeamSide;
    home?: TeamSide;
  };
  betlabContext?: {
    currentSeasonSample?: number;
    home?: Partial<TeamProfile>;
    away?: Partial<TeamProfile>;
  };
};

export type BetlabConfig = {
  homeAdvantage: number;
  bbThreshold: {
    strong: number;
    weak: number;
  };
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

export type MarketSummary = {
  bookmaker?: string;
  lastUpdate?: string | null;
  homeMoneyline?: number | null;
  awayMoneyline?: number | null;
  overPoint?: number | null;
  overPrice?: number | null;
  underPoint?: number | null;
  underPrice?: number | null;
  homeSpreadPoint?: number | null;
  homeSpreadPrice?: number | null;
  awaySpreadPoint?: number | null;
  awaySpreadPrice?: number | null;
};

export type GameAnalysis = {
  recommendation: {
    level: "strong" | "weak" | "watch";
    headline: string;
    description: string;
  };
  market: {
    hasMarketOdds: boolean;
    bookmakerTitle: string | null;
    rawHomePrice: number | null;
    rawAwayPrice: number | null;
  };
  result: {
    expectedHomeRuns: number;
    expectedAwayRuns: number;
    expectedMargin: number;
    expectedTotal: number;
    moneyline: {
      homeProb: number;
      awayProb: number;
      homeBB: number;
      awayBB: number;
    };
    spread: {
      homeProb: number;
      awayProb: number;
      homeBB: number;
      awayBB: number;
      homePoint: number;
      awayPoint: number;
    };
    total: {
      line: number;
      overProb: number;
      underProb: number;
      overBB: number;
      underBB: number;
    };
  };
  bbBreakdown: {
    pitcher: number;
    form: number;
    batting: number;
    bullpen: number;
    lineup: number;
    park: number;
  };
  meta: {
    title: string;
    gamePk: number | null;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function normalizeName(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getEnglishTeamName(side?: TeamSide) {
  return normalizeName(
    side?.team?.name ||
      side?.team?.clubName ||
      side?.team?.shortName ||
      side?.team?.abbreviation ||
      ""
  );
}

function getDisplayTeamName(side?: TeamSide) {
  return (
    side?.team?.clubName ||
    side?.team?.name ||
    side?.team?.shortName ||
    side?.team?.abbreviation ||
    "-"
  );
}

function getPitcherName(side?: TeamSide) {
  return normalizeName(side?.probablePitcher?.fullName || "");
}

function getLastWord(value: string) {
  const parts = value.split(" ").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

function impliedProbFromAmericanOdds(odds: number | null | undefined) {
  if (typeof odds !== "number" || Number.isNaN(odds)) return null;
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function removeVigPair(a: number | null, b: number | null) {
  if (a == null || b == null) return null;
  const total = a + b;
  if (!Number.isFinite(total) || total <= 0) return null;
  return { a: a / total, b: b / total };
}

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function scaledHash(value: string, spread: number) {
  if (!value) return 0;
  const n = (hashString(value) % 1000) / 999;
  return (n - 0.5) * 2 * spread;
}

function squash(value: number, maxAbs: number) {
  return Math.tanh(value / maxAbs) * maxAbs;
}

function normalizeOddsMap(input: any): Record<string, MarketSummary> {
  if (!input) return {};

  if (input.oddsByGame && typeof input.oddsByGame === "object") {
    return input.oddsByGame as Record<string, MarketSummary>;
  }

  const dataArray = Array.isArray(input)
    ? input
    : Array.isArray(input.data)
      ? input.data
      : null;

  if (!dataArray) {
    return typeof input === "object" ? (input as Record<string, MarketSummary>) : {};
  }

  const out: Record<string, MarketSummary> = {};

  for (const event of dataArray) {
    const home = normalizeName(event?.home_team);
    const away = normalizeName(event?.away_team);
    if (!home || !away) continue;

    const bookmaker = Array.isArray(event?.bookmakers) ? event.bookmakers[0] : null;
    const markets = Array.isArray(bookmaker?.markets) ? bookmaker.markets : [];

    const h2h = markets.find((m: any) => m?.key === "h2h");
    const spreads = markets.find((m: any) => m?.key === "spreads");
    const totals = markets.find((m: any) => m?.key === "totals");

    const h2hOutcomes = Array.isArray(h2h?.outcomes) ? h2h.outcomes : [];
    const spreadOutcomes = Array.isArray(spreads?.outcomes) ? spreads.outcomes : [];
    const totalOutcomes = Array.isArray(totals?.outcomes) ? totals.outcomes : [];

    const homeH2h = h2hOutcomes.find((o: any) => normalizeName(o?.name) === home);
    const awayH2h = h2hOutcomes.find((o: any) => normalizeName(o?.name) === away);
    const homeSpread = spreadOutcomes.find((o: any) => normalizeName(o?.name) === home);
    const awaySpread = spreadOutcomes.find((o: any) => normalizeName(o?.name) === away);
    const over = totalOutcomes.find((o: any) => normalizeName(o?.name) === "over");
    const under = totalOutcomes.find((o: any) => normalizeName(o?.name) === "under");

    const summary: MarketSummary = {
      bookmaker: bookmaker?.title || "bookmaker",
      lastUpdate: bookmaker?.last_update || null,
      homeMoneyline: typeof homeH2h?.price === "number" ? homeH2h.price : null,
      awayMoneyline: typeof awayH2h?.price === "number" ? awayH2h.price : null,
      homeSpreadPoint: typeof homeSpread?.point === "number" ? homeSpread.point : null,
      homeSpreadPrice: typeof homeSpread?.price === "number" ? homeSpread.price : null,
      awaySpreadPoint: typeof awaySpread?.point === "number" ? awaySpread.point : null,
      awaySpreadPrice: typeof awaySpread?.price === "number" ? awaySpread.price : null,
      overPoint: typeof over?.point === "number" ? over.point : null,
      overPrice: typeof over?.price === "number" ? over.price : null,
      underPoint: typeof under?.point === "number" ? under.point : null,
      underPrice: typeof under?.price === "number" ? under.price : null,
    };

    const keys = [
      `${away} @ ${home}`,
      `${home} vs ${away}`,
      `${away} at ${home}`,
      `${home}|${away}`,
      `${away}|${home}`,
      `${home} ${away}`,
      `${away} ${home}`,
    ];

    for (const key of keys) out[key] = summary;
  }

  return out;
}

function findMarketForGame(game: MlbGame, oddsInput?: any): MarketSummary | null {
  const oddsByGame = normalizeOddsMap(oddsInput);
  const home = getEnglishTeamName(game.teams?.home);
  const away = getEnglishTeamName(game.teams?.away);

  if (!home || !away) return null;

  const homeLast = getLastWord(home);
  const awayLast = getLastWord(away);

  const exactKeys = [
    `${away} @ ${home}`,
    `${home} vs ${away}`,
    `${away} at ${home}`,
    `${home}|${away}`,
    `${away}|${home}`,
    `${home} ${away}`,
    `${away} ${home}`,
  ];

  for (const key of exactKeys) if (oddsByGame[key]) return oddsByGame[key];

  for (const [key, value] of Object.entries(oddsByGame)) {
    const normalizedKey = normalizeName(key);
    if (normalizedKey.includes(home) && normalizedKey.includes(away)) return value;
  }

  for (const [key, value] of Object.entries(oddsByGame)) {
    const normalizedKey = normalizeName(key);
    if (homeLast && awayLast && normalizedKey.includes(homeLast) && normalizedKey.includes(awayLast)) {
      return value;
    }
  }

  return null;
}

function buildRecommendationHeadline(edge: number, bb: number, config: BetlabConfig) {
  if (bb >= config.bbThreshold.strong) return "머니라인 홈 강추천";
  if (bb >= config.bbThreshold.weak) return "머니라인 홈 약추천";
  if (bb <= -config.bbThreshold.strong) return "머니라인 원정 강추천";
  if (bb <= -config.bbThreshold.weak) return "머니라인 원정 약추천";
  return edge >= 0 ? "머니라인 홈 관찰" : "머니라인 원정 관찰";
}

function currentSeasonWeight(sampleSize?: number) {
  const n = Number(sampleSize ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0.16;
  return clamp(0.16 + n / 115, 0.16, 0.84);
}

function buildFallbackProfile(teamName: string, pitcherName: string, gameDate: string): TeamProfile {
  return {
    multiYearAttack: scaledHash(`multi-atk:${teamName}`, 0.82),
    multiYearDefense: scaledHash(`multi-def:${teamName}`, 0.72),
    currentAttack: scaledHash(`curr-atk:${teamName}:${gameDate.slice(0, 10)}`, 0.92),
    currentDefense: scaledHash(`curr-def:${teamName}:${gameDate.slice(0, 10)}`, 0.78),
    recentForm: scaledHash(`form:${teamName}:${gameDate.slice(0, 10)}`, 0.48),
    bullpen: scaledHash(`bp:${teamName}`, 0.46),
    lineup: scaledHash(`lu:${teamName}`, 0.34),
    starter: scaledHash(`sp:${pitcherName || teamName}`, 0.88),
  };
}

function mergeProfile(base: TeamProfile, override?: Partial<TeamProfile>): TeamProfile {
  return {
    multiYearAttack: override?.multiYearAttack ?? base.multiYearAttack,
    multiYearDefense: override?.multiYearDefense ?? base.multiYearDefense,
    currentAttack: override?.currentAttack ?? base.currentAttack,
    currentDefense: override?.currentDefense ?? base.currentDefense,
    recentForm: override?.recentForm ?? base.recentForm,
    bullpen: override?.bullpen ?? base.bullpen,
    lineup: override?.lineup ?? base.lineup,
    starter: override?.starter ?? base.starter,
  };
}

export function buildGameAnalysis(params: {
  game: MlbGame;
  schedule?: MlbGame[];
  oddsData?: any;
  config: BetlabConfig;
}): GameAnalysis {
  const { game, oddsData, config } = params;
  const market = findMarketForGame(game, oddsData);

  const homeTeam = getEnglishTeamName(game.teams?.home);
  const awayTeam = getEnglishTeamName(game.teams?.away);
  const homePitcher = getPitcherName(game.teams?.home);
  const awayPitcher = getPitcherName(game.teams?.away);
  const gameDate = game.gameDate || game.officialDate || "";

  const sampleSize = game.betlabContext?.currentSeasonSample ?? 0;
  const currW = currentSeasonWeight(sampleSize);
  const histW = 1 - currW;

  const homeProfile = mergeProfile(buildFallbackProfile(homeTeam, homePitcher, gameDate), game.betlabContext?.home);
  const awayProfile = mergeProfile(buildFallbackProfile(awayTeam, awayPitcher, gameDate), game.betlabContext?.away);

  const rawPitcherPart = (homeProfile.starter - awayProfile.starter) * (0.24 + config.weights.pitcher * 0.24);
  const rawFormPart = (homeProfile.recentForm - awayProfile.recentForm) * (0.12 + config.weights.form * 0.16);
  const rawBattingPart =
    ((homeProfile.multiYearAttack * histW + homeProfile.currentAttack * currW) -
      (awayProfile.multiYearAttack * histW + awayProfile.currentAttack * currW)) * 0.98;
  const rawBullpenPart =
    ((homeProfile.multiYearDefense * histW + homeProfile.currentDefense * currW + homeProfile.bullpen * (0.10 + config.weights.bullpen * 0.10)) -
      (awayProfile.multiYearDefense * histW + awayProfile.currentDefense * currW + awayProfile.bullpen * (0.10 + config.weights.bullpen * 0.10))) * 0.42;
  const rawLineupPart = (homeProfile.lineup - awayProfile.lineup) * (0.08 + config.weights.lineup * 0.12);
  const rawParkPart = scaledHash(`park:${homeTeam}:${awayTeam}`, 0.28) * (0.16 + config.weights.park * 0.10);

  const pitcherPart = squash(rawPitcherPart, 0.46);
  const formPart = squash(rawFormPart, 0.24);
  const battingPart = squash(rawBattingPart, 0.52);
  const bullpenPart = squash(rawBullpenPart, 0.26);
  const lineupPart = squash(rawLineupPart, 0.18);
  const parkPart = squash(rawParkPart, 0.12);

  const homeAttack =
    homeProfile.multiYearAttack * histW +
    homeProfile.currentAttack * currW +
    homeProfile.recentForm * (0.15 + config.weights.form * 0.18) +
    homeProfile.lineup * (0.08 + config.weights.lineup * 0.12);

  const awayAttack =
    awayProfile.multiYearAttack * histW +
    awayProfile.currentAttack * currW +
    awayProfile.recentForm * (0.15 + config.weights.form * 0.18) +
    awayProfile.lineup * (0.08 + config.weights.lineup * 0.12);

  const homeRunPrevention =
    homeProfile.multiYearDefense * histW +
    homeProfile.currentDefense * currW +
    homeProfile.bullpen * (0.10 + config.weights.bullpen * 0.10) +
    homeProfile.starter * (0.24 + config.weights.pitcher * 0.22);

  const awayRunPrevention =
    awayProfile.multiYearDefense * histW +
    awayProfile.currentDefense * currW +
    awayProfile.bullpen * (0.10 + config.weights.bullpen * 0.10) +
    awayProfile.starter * (0.24 + config.weights.pitcher * 0.22);

  const timeAdj = (() => {
    const d = new Date(gameDate);
    if (Number.isNaN(d.getTime())) return 0;
    const hour = d.getUTCHours();
    if (hour < 18) return -0.08;
    if (hour < 23) return 0.06;
    return 0.02;
  })();

  const baseGameTotal = config.scoring.baseRuns * 2;

  const modelTotalRaw =
    baseGameTotal +
    parkPart +
    timeAdj +
    homeAttack * 1.08 +
    awayAttack * 1.08 -
    homeRunPrevention * 0.70 -
    awayRunPrevention * 0.70;

  const marketTotalLine = market?.overPoint ?? null;
  const expectedTotal = Number(
    clamp(
      marketTotalLine == null ? modelTotalRaw : modelTotalRaw * 0.86 + marketTotalLine * 0.14,
      5.8,
      13.0
    ).toFixed(2)
  );

  const edgeRaw =
    config.homeAdvantage * 0.86 +
    config.scoring.homeBonus * 0.58 +
    config.scoring.awayPenalty * -0.10 +
    battingPart +
    formPart +
    lineupPart +
    pitcherPart +
    bullpenPart +
    parkPart;

  const expectedMargin = Number(clamp(edgeRaw, -3.8, 3.8).toFixed(2));

  const homeShare = clamp(logistic(expectedMargin * 0.62), 0.33, 0.67);
  const expectedHomeRuns = Number(clamp(expectedTotal * homeShare, 2.1, 8.2).toFixed(2));
  const expectedAwayRuns = Number(clamp(expectedTotal - expectedHomeRuns, 1.9, 8.0).toFixed(2));
  const finalTotal = Number((expectedHomeRuns + expectedAwayRuns).toFixed(2));
  const finalMargin = Number((expectedHomeRuns - expectedAwayRuns).toFixed(2));

  const marketHomeProbRaw = impliedProbFromAmericanOdds(market?.homeMoneyline);
  const marketAwayProbRaw = impliedProbFromAmericanOdds(market?.awayMoneyline);
  const deVigMl = removeVigPair(marketHomeProbRaw, marketAwayProbRaw);

  const marketHomeProb = deVigMl?.a ?? marketHomeProbRaw;
  const marketAwayProb = deVigMl?.b ?? marketAwayProbRaw;

  const modelHomeProb = clamp(logistic(finalMargin * 0.94), 0.11, 0.89);
  const modelAwayProb = Number((1 - modelHomeProb).toFixed(4));

  const blendedHomeProb =
    marketHomeProb == null ? modelHomeProb : clamp(modelHomeProb * 0.80 + marketHomeProb * 0.20, 0.08, 0.92);
  const blendedAwayProb =
    marketAwayProb == null ? modelAwayProb : clamp(modelAwayProb * 0.80 + marketAwayProb * 0.20, 0.08, 0.92);

  const homeBB = Number((blendedHomeProb - (marketHomeProb ?? 0.5)).toFixed(2));
  const awayBB = Number((blendedAwayProb - (marketAwayProb ?? 0.5)).toFixed(2));

  const spreadLineHome = market?.homeSpreadPoint ?? -1.5;
  const spreadLineAway = market?.awaySpreadPoint ?? 1.5;
  const spreadDelta = finalMargin - Math.abs(spreadLineHome);
  const spreadHomeModel = clamp(logistic(spreadDelta * 0.78), 0.1, 0.9);
  const spreadAwayModel = Number((1 - spreadHomeModel).toFixed(4));

  const spreadHomePriceProb = impliedProbFromAmericanOdds(market?.homeSpreadPrice);
  const spreadAwayPriceProb = impliedProbFromAmericanOdds(market?.awaySpreadPrice);
  const deVigSpread = removeVigPair(spreadHomePriceProb, spreadAwayPriceProb);

  const spreadHomeMarket = deVigSpread?.a ?? spreadHomePriceProb ?? 0.5;
  const spreadAwayMarket = deVigSpread?.b ?? spreadAwayPriceProb ?? 0.5;

  const spreadHomeProb = clamp(spreadHomeModel * 0.80 + spreadHomeMarket * 0.20, 0.08, 0.92);
  const spreadAwayProb = clamp(spreadAwayModel * 0.80 + spreadAwayMarket * 0.20, 0.08, 0.92);

  const spreadHomeBB = Number((spreadHomeProb - spreadHomeMarket).toFixed(2));
  const spreadAwayBB = Number((spreadAwayProb - spreadAwayMarket).toFixed(2));

  const totalLine = market?.overPoint ?? 8.5;
  const totalDiff = finalTotal - totalLine;
  const overModel = clamp(logistic(totalDiff * 0.86), 0.1, 0.9);
  const underModel = Number((1 - overModel).toFixed(4));

  const overPriceProb = impliedProbFromAmericanOdds(market?.overPrice);
  const underPriceProb = impliedProbFromAmericanOdds(market?.underPrice);
  const deVigTotal = removeVigPair(overPriceProb, underPriceProb);

  const overMarket = deVigTotal?.a ?? overPriceProb ?? 0.5;
  const underMarket = deVigTotal?.b ?? underPriceProb ?? 0.5;

  const overProb = clamp(overModel * 0.80 + overMarket * 0.20, 0.08, 0.92);
  const underProb = clamp(underModel * 0.80 + underMarket * 0.20, 0.08, 0.92);

  const overBB = Number((overProb - overMarket).toFixed(2));
  const underBB = Number((underProb - underMarket).toFixed(2));

  const bestBB = homeBB;
  const headline = buildRecommendationHeadline(finalMargin, bestBB, config);

  return {
    recommendation: {
      level: bestBB >= config.bbThreshold.strong ? "strong" : bestBB >= config.bbThreshold.weak ? "weak" : "watch",
      headline,
      description: market?.bookmaker
        ? `시장 배당 연결 · BB ${bestBB.toFixed(2)}`
        : `아직 확실한 엣지는 약함 · BB ${bestBB.toFixed(2)}`,
    },
    market: {
      hasMarketOdds: Boolean(market?.bookmaker),
      bookmakerTitle: market?.bookmaker ?? null,
      rawHomePrice: market?.homeMoneyline ?? null,
      rawAwayPrice: market?.awayMoneyline ?? null,
    },
    result: {
      expectedHomeRuns,
      expectedAwayRuns,
      expectedMargin: finalMargin,
      expectedTotal: finalTotal,
      moneyline: { homeProb: blendedHomeProb, awayProb: blendedAwayProb, homeBB, awayBB },
      spread: {
        homeProb: spreadHomeProb,
        awayProb: spreadAwayProb,
        homeBB: spreadHomeBB,
        awayBB: spreadAwayBB,
        homePoint: spreadLineHome,
        awayPoint: spreadLineAway,
      },
      total: { line: totalLine, overProb, underProb, overBB, underBB },
    },
    bbBreakdown: {
      pitcher: Number(pitcherPart.toFixed(2)),
      form: Number(formPart.toFixed(2)),
      batting: Number(battingPart.toFixed(2)),
      bullpen: Number(bullpenPart.toFixed(2)),
      lineup: Number(lineupPart.toFixed(2)),
      park: Number(parkPart.toFixed(2)),
    },
    meta: {
      title: `${getDisplayTeamName(game.teams?.away)} @ ${getDisplayTeamName(game.teams?.home)}`,
      gamePk: game.gamePk ?? null,
    },
  };
}

export function analyzeGame(game: MlbGame, config: BetlabConfig, oddsInput?: any) {
  return buildGameAnalysis({ game, oddsData: oddsInput, config });
}
