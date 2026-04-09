import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeGameReal } from "@/lib/engine/betlabAnalysis";

export type PublicGame = {
  id: string;
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  bbValue: number;
  reason: string;
  homePitcher: string;
  awayPitcher: string;
  gameTime: string;
  marketType?: string;
  expectedHomeRuns?: number;
  expectedAwayRuns?: number;
  expectedMargin?: number;
  expectedTotal?: number;
};

export type AdminUser = {
  id: string;
  username: string;
  nickname: string;
  email: string;
  role: string;
  createdAt: string;
};

const DEFAULT_SETTINGS = {
  homeAdvantage: 0.12,
  pitcherWeight: 1.0,
  formWeight: 0.8,
  battingWeight: 0.9,
  bullpenWeight: 0.85,
  totalWeight: 1.0,
  strongThreshold: 0.22,
  mediumThreshold: 0.12,
};

function getBaseballToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatGameTime(gameDate: string) {
  if (!gameDate) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(gameDate));
  } catch {
    return String(gameDate).slice(5, 16).replace("T", " ");
  }
}

async function fetchPitchersAndTime(gamePk: number, fallbackDate: string) {
  try {
    const liveResponse = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, {
      cache: "no-store",
    });

    if (liveResponse.ok) {
      const liveJson = await liveResponse.json();
      const gameData = liveJson?.gameData ?? {};
      return {
        homePitcher: String(gameData?.probablePitchers?.home?.fullName ?? "미정"),
        awayPitcher: String(gameData?.probablePitchers?.away?.fullName ?? "미정"),
        gameTime: formatGameTime(String(gameData?.datetime?.dateTime ?? fallbackDate)),
      };
    }
  } catch {}

  return {
    homePitcher: "미정",
    awayPitcher: "미정",
    gameTime: formatGameTime(fallbackDate),
  };
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function loadEngineSettings() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("settings_json")
    .eq("settings_key", "betlab_core")
    .maybeSingle();

  return {
    ...DEFAULT_SETTINGS,
    ...(data?.settings_json ?? {}),
  };
}

async function enrichExpectedValuesIfMissing(baseGame: PublicGame) {
  const missingExpectedValues =
    num(baseGame.expectedHomeRuns) === 0 &&
    num(baseGame.expectedAwayRuns) === 0 &&
    num(baseGame.expectedMargin) === 0 &&
    num(baseGame.expectedTotal) === 0;

  if (!missingExpectedValues) {
    return baseGame;
  }

  try {
    const settings = await loadEngineSettings();
    const analyzed = await analyzeGameReal(
      {
        gamePk: baseGame.gamePk,
        gameDate: baseGame.gameDate,
        homeTeam: baseGame.homeTeam,
        awayTeam: baseGame.awayTeam,
      },
      settings
    );

    return {
      ...baseGame,
      recommendation: analyzed.recommendation || baseGame.recommendation,
      bbValue: num(analyzed.bbValue, baseGame.bbValue),
      reason: analyzed.reason || baseGame.reason,
      marketType: analyzed.marketType || baseGame.marketType,
      expectedHomeRuns: num(analyzed.expectedHomeRuns, baseGame.expectedHomeRuns),
      expectedAwayRuns: num(analyzed.expectedAwayRuns, baseGame.expectedAwayRuns),
      expectedMargin: num(analyzed.expectedMargin, baseGame.expectedMargin),
      expectedTotal: num(analyzed.expectedTotal, baseGame.expectedTotal),
    };
  } catch {
    return baseGame;
  }
}

async function mapAnalysisRow(row: any, enrichExpected = false): Promise<PublicGame> {
  const extra = await fetchPitchersAndTime(Number(row.game_pk ?? 0), String(row.game_date ?? ""));
  const mapped: PublicGame = {
    id: String(row.id),
    gamePk: Number(row.game_pk ?? 0),
    gameDate: String(row.game_date ?? ""),
    homeTeam: String(row.home_team ?? ""),
    awayTeam: String(row.away_team ?? ""),
    recommendation: String(row.recommendation ?? "관찰"),
    bbValue: Number(row.bb_value ?? 0),
    reason: String(row.reason ?? ""),
    homePitcher: extra.homePitcher,
    awayPitcher: extra.awayPitcher,
    gameTime: extra.gameTime,
    marketType: String(row.market_type ?? "moneyline"),
    expectedHomeRuns: num(row.expected_home_runs ?? 0),
    expectedAwayRuns: num(row.expected_away_runs ?? 0),
    expectedMargin: num(row.expected_margin ?? 0),
    expectedTotal: num(row.expected_total ?? 0),
  };

  return enrichExpected ? await enrichExpectedValuesIfMissing(mapped) : mapped;
}

const BASE_SELECT =
  "id, game_pk, game_date, home_team, away_team, recommendation, bb_value, reason, market_type, expected_home_runs, expected_away_runs, expected_margin, expected_total";

export async function getPublicGames(): Promise<PublicGame[]> {
  const supabase = createSupabaseServerClient();
  const today = getBaseballToday();

  const todayQuery = await supabase
    .from("analyses")
    .select(BASE_SELECT)
    .eq("game_date", today)
    .order("bb_value", { ascending: false })
    .limit(20);

  let rows = todayQuery.data ?? [];

  if (todayQuery.error || rows.length === 0) {
    const latestDateQuery = await supabase
      .from("analyses")
      .select("game_date")
      .order("game_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestDate = String(latestDateQuery.data?.game_date ?? "").slice(0, 10);
    if (!latestDate) return [];

    const latestQuery = await supabase
      .from("analyses")
      .select(BASE_SELECT)
      .eq("game_date", latestDate)
      .order("bb_value", { ascending: false })
      .limit(20);

    if (latestQuery.error || !latestQuery.data) return [];
    rows = latestQuery.data;
  }

  return await Promise.all(rows.map((row) => mapAnalysisRow(row, false)));
}

export async function getPublicGame(gameId: string): Promise<PublicGame | null> {
  const supabase = createSupabaseServerClient();

  const byId = await supabase
    .from("analyses")
    .select(BASE_SELECT)
    .eq("id", gameId)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return await mapAnalysisRow(byId.data, true);
  }

  const numericGamePk = Number(gameId);
  if (Number.isFinite(numericGamePk) && numericGamePk > 0) {
    const byGamePk = await supabase
      .from("analyses")
      .select(BASE_SELECT)
      .eq("game_pk", numericGamePk)
      .order("game_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!byGamePk.error && byGamePk.data) {
      return await mapAnalysisRow(byGamePk.data, true);
    }
  }

  return null;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, nickname, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: String(row.id),
    username: String(row.username ?? ""),
    nickname: String(row.nickname ?? ""),
    email: String(row.email ?? ""),
    role: String(row.role ?? "user"),
    createdAt: String(row.created_at ?? ""),
  }));
}
