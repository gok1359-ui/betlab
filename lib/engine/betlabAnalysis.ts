type GameInput = {
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
};

type TeamBasics = { id: number; name: string };
type ProbablePitcher = { id: number; fullName: string } | null;
type EngineSettings = {
  homeAdvantage: number; pitcherWeight: number; formWeight: number; battingWeight: number;
  bullpenWeight: number; totalWeight: number; strongThreshold: number; mediumThreshold: number;
};
type TeamContext = {
  teamId: number; teamName: string; wins: number; losses: number; winPct: number;
  runsScoredPerGame: number; runsAllowedPerGame: number;
  starter: { id: number | null; name: string; era: number; whip: number; k9: number; ip: number; };
};
export type RealAnalysisResult = {
  gamePk: number; gameDate: string; homeTeam: string; awayTeam: string;
  recommendation: string; bbValue: number; reason: string;
  marketType: "moneyline" | "spread" | "total";
  expectedHomeRuns: number; expectedAwayRuns: number; expectedMargin: number; expectedTotal: number;
  bbBreakdown: { homeAdvantage: number; starter: number; batting: number; bullpen: number; form: number; total: number; };
};

const DEFAULT_SETTINGS: EngineSettings = {
  homeAdvantage: 0.12, pitcherWeight: 1.0, formWeight: 0.8, battingWeight: 0.9,
  bullpenWeight: 0.85, totalWeight: 1.0, strongThreshold: 0.22, mediumThreshold: 0.12,
};

async function safeJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}
function normalizeTeamName(name: string) { return name === "D-backs" ? "Arizona Diamondbacks" : name; }

async function getGameContext(gamePk: number, date: string) {
  try {
    const liveJson = await safeJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
    const gameData = liveJson.gameData ?? {};
    const teams = gameData.teams ?? {};
    return {
      gameDate: String(gameData.datetime?.officialDate ?? date).slice(0, 10),
      homeTeam: { id: Number(teams.home?.id), name: normalizeTeamName(String(teams.home?.name ?? "")) },
      awayTeam: { id: Number(teams.away?.id), name: normalizeTeamName(String(teams.away?.name ?? "")) },
      probablePitchers: {
        home: gameData.probablePitchers?.home ? { id: Number(gameData.probablePitchers.home.id), fullName: String(gameData.probablePitchers.home.fullName ?? "미정") } : null,
        away: gameData.probablePitchers?.away ? { id: Number(gameData.probablePitchers.away.id), fullName: String(gameData.probablePitchers.away.fullName ?? "미정") } : null,
      },
    };
  } catch {
    const json = await safeJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}`);
    for (const day of json.dates ?? []) for (const game of day.games ?? []) {
      if (Number(game.gamePk) === Number(gamePk)) {
        return {
          gameDate: String(game.gameDate ?? date).slice(0, 10),
          homeTeam: { id: Number(game?.teams?.home?.team?.id), name: normalizeTeamName(String(game?.teams?.home?.team?.name ?? "")) },
          awayTeam: { id: Number(game?.teams?.away?.team?.id), name: normalizeTeamName(String(game?.teams?.away?.team?.name ?? "")) },
          probablePitchers: {
            home: game?.teams?.home?.probablePitcher ? { id: Number(game.teams.home.probablePitcher.id), fullName: String(game.teams.home.probablePitcher.fullName ?? "미정") } : null,
            away: game?.teams?.away?.probablePitcher ? { id: Number(game.teams.away.probablePitcher.id), fullName: String(game.teams.away.probablePitcher.fullName ?? "미정") } : null,
          },
        };
      }
    }
    throw new Error(`game context not found: ${gamePk}`);
  }
}
async function getSeasonTeamStats(teamId: number, season: number) {
  const [hittingJson, pitchingJson] = await Promise.all([
    safeJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${season}`),
    safeJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=${season}`),
  ]);
  const hitting = hittingJson.stats?.[0]?.splits?.[0]?.stat ?? {};
  const pitching = pitchingJson.stats?.[0]?.splits?.[0]?.stat ?? {};
  const gamesPlayed = Number(hitting.gamesPlayed ?? pitching.gamesPlayed ?? 0);
  const runsScored = Number(hitting.runs ?? 0);
  const runsAllowed = Number(pitching.runs ?? 0);
  const wins = Number(pitching.wins ?? 0);
  const losses = Number(pitching.losses ?? 0);
  return {
    runsScoredPerGame: gamesPlayed > 0 ? runsScored / gamesPlayed : 4.4,
    runsAllowedPerGame: gamesPlayed > 0 ? runsAllowed / gamesPlayed : 4.4,
    wins, losses, winPct: wins + losses > 0 ? wins / (wins + losses) : 0.5,
  };
}
async function getPitcherSeasonStats(pitcherId: number, season: number) {
  const json = await safeJson(`https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${season}`);
  const stat = json.stats?.[0]?.splits?.[0]?.stat ?? {};
  return { era: Number(stat.era ?? 4.2), whip: Number(stat.whip ?? 1.32), k9: Number(stat.strikeoutsPer9Inn ?? 8.3), ip: Number(stat.inningsPitched ?? 0) };
}
async function buildTeamContext(team: TeamBasics, starter: ProbablePitcher, season: number): Promise<TeamContext> {
  const teamStats = await getSeasonTeamStats(team.id, season);
  let starterStats = { id: null as number | null, name: starter?.fullName ?? "미정", era: 4.2, whip: 1.32, k9: 8.3, ip: 0 };
  if (starter?.id) {
    const stats = await getPitcherSeasonStats(starter.id, season).catch(() => null);
    if (stats) starterStats = { id: starter.id, name: starter.fullName, era: stats.era, whip: stats.whip, k9: stats.k9, ip: stats.ip };
  }
  return { teamId: team.id, teamName: team.name, wins: teamStats.wins, losses: teamStats.losses, winPct: teamStats.winPct, runsScoredPerGame: teamStats.runsScoredPerGame, runsAllowedPerGame: teamStats.runsAllowedPerGame, starter: starterStats };
}
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function round2(value: number) { return Math.round(value * 100) / 100; }
function pickStrength(bbValue: number, settings: EngineSettings) { return bbValue >= settings.strongThreshold ? "강추천" : bbValue >= settings.mediumThreshold ? "중추천" : "약추천"; }
function buildReason(starterEdge: number, offenseEdge: number, bullpenEdge: number, totalLean: number) {
  const reasons: string[] = [];
  if (Math.abs(starterEdge) >= 0.09) reasons.push(starterEdge > 0 ? "홈 선발 우위" : "원정 선발 우위");
  if (Math.abs(offenseEdge) >= 0.08) reasons.push(offenseEdge > 0 ? "홈 타격 우위" : "원정 타격 우위");
  if (Math.abs(bullpenEdge) >= 0.06) reasons.push(bullpenEdge > 0 ? "홈 불펜 우위" : "원정 불펜 우위");
  if (Math.abs(totalLean) >= 0.1) reasons.push(totalLean > 0 ? "다득점 성향" : "저득점 성향");
  if (!reasons.length) reasons.push("전력차 크지 않음");
  return reasons.slice(0, 2).join(" + ");
}
function selectMarket(moneylineBb: number, spreadBb: number, totalBb: number, homeLean: boolean, totalLean: number, settings: EngineSettings) {
  return [
    { marketType: "moneyline" as const, bbValue: moneylineBb, recommendation: `머니라인 ${homeLean ? "홈" : "원정"} ${pickStrength(moneylineBb, settings)}` },
    { marketType: "spread" as const, bbValue: spreadBb, recommendation: `핸디캡 ${homeLean ? "홈" : "원정"} ${pickStrength(spreadBb, settings)}` },
    { marketType: "total" as const, bbValue: totalBb, recommendation: `언오버 ${totalLean >= 0 ? "오버" : "언더"} ${pickStrength(totalBb, settings)}` },
  ].sort((a, b) => b.bbValue - a.bbValue)[0];
}
export async function analyzeGameReal(game: GameInput, settingsInput?: Partial<EngineSettings>): Promise<RealAnalysisResult> {
  const settings: EngineSettings = { ...DEFAULT_SETTINGS, ...(settingsInput ?? {}) };
  const date = String(game.gameDate).slice(0, 10);
  const season = new Date(date).getUTCFullYear();
  const gameContext = await getGameContext(game.gamePk, date);
  const [home, away] = await Promise.all([
    buildTeamContext(gameContext.homeTeam, gameContext.probablePitchers.home, season),
    buildTeamContext(gameContext.awayTeam, gameContext.probablePitchers.away, season),
  ]);
  const homeAdvRaw = settings.homeAdvantage * 0.45;
  const starterHomeScore = (4.4 - home.starter.era) * 0.18 + (1.32 - home.starter.whip) * 0.45 + (home.starter.k9 - 8.3) * 0.03;
  const starterAwayScore = (4.4 - away.starter.era) * 0.18 + (1.32 - away.starter.whip) * 0.45 + (away.starter.k9 - 8.3) * 0.03;
  const starterEdgeRaw = (starterHomeScore - starterAwayScore) * settings.pitcherWeight;
  const offenseEdgeRaw = ((home.runsScoredPerGame - away.runsScoredPerGame) * 0.18 + (home.winPct - away.winPct) * 0.6) * settings.battingWeight;
  const bullpenEdgeRaw = ((away.runsAllowedPerGame - home.runsAllowedPerGame) * 0.16) * settings.bullpenWeight;
  const formEdgeRaw = ((home.winPct - away.winPct) * 0.35) * settings.formWeight;
  const moneylineEdge = homeAdvRaw + starterEdgeRaw + offenseEdgeRaw + bullpenEdgeRaw + formEdgeRaw;
  const homeLean = moneylineEdge >= 0;
  const expectedHomeRuns = round2((home.runsScoredPerGame * 0.58 + away.runsAllowedPerGame * 0.42) + starterEdgeRaw * 0.8 + homeAdvRaw * 1.2);
  const expectedAwayRuns = round2((away.runsScoredPerGame * 0.58 + home.runsAllowedPerGame * 0.42) - starterEdgeRaw * 0.45);
  const expectedMargin = round2(expectedHomeRuns - expectedAwayRuns);
  const expectedTotal = round2(expectedHomeRuns + expectedAwayRuns);
  const totalLeanRaw = ((expectedTotal - 8.5) * 0.08) * settings.totalWeight;
  const bbStarter = clamp(Math.abs(starterEdgeRaw), 0, 0.32);
  const bbBatting = clamp(Math.abs(offenseEdgeRaw), 0, 0.22);
  const bbBullpen = clamp(Math.abs(bullpenEdgeRaw), 0, 0.18);
  const bbForm = clamp(Math.abs(formEdgeRaw), 0, 0.12);
  const bbHomeAdv = clamp(Math.abs(homeAdvRaw), 0.03, 0.07);
  const moneylineBb = round2(clamp(bbStarter + bbBatting + bbBullpen + bbForm + bbHomeAdv, 0.04, 0.45));
  const spreadBb = round2(clamp(Math.abs(expectedMargin) * 0.12 + bbStarter * 0.35 + bbBullpen * 0.2, 0.04, 0.45));
  const totalBb = round2(clamp(Math.abs(totalLeanRaw) + bbBatting * 0.45 + bbBullpen * 0.18 + bbForm * 0.12, 0.04, 0.45));
  const selected = selectMarket(moneylineBb, spreadBb, totalBb, homeLean, totalLeanRaw, settings);
  return {
    gamePk: game.gamePk, gameDate: gameContext.gameDate, homeTeam: home.teamName, awayTeam: away.teamName,
    recommendation: selected.recommendation, bbValue: selected.bbValue, reason: buildReason(starterEdgeRaw, offenseEdgeRaw, bullpenEdgeRaw, totalLeanRaw),
    marketType: selected.marketType, expectedHomeRuns, expectedAwayRuns, expectedMargin, expectedTotal,
    bbBreakdown: { homeAdvantage: round2(bbHomeAdv), starter: round2(bbStarter), batting: round2(bbBatting), bullpen: round2(bbBullpen), form: round2(bbForm), total: round2(selected.bbValue) },
  };
}
