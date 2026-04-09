const MLB_BASE = 'https://statsapi.mlb.com/api/v1';
const ODDS_BASE = 'https://api.the-odds-api.com/v4';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options ?? { next: { revalidate: 60 } });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText} ${text}`.trim());
  }
  return response.json() as Promise<T>;
}

export async function getMlbSchedule(date: string) {
  return fetchJson(`${MLB_BASE}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,team,venue`);
}

export async function getPitcherStats(pitcherId: number | string, season: number) {
  return fetchJson(`${MLB_BASE}/people/${pitcherId}/stats?stats=season&group=pitching&season=${season}`);
}

export async function getTeamBattingStats(teamId: number | string, season: number) {
  return fetchJson(`${MLB_BASE}/teams/${teamId}/stats?stats=season&group=hitting&season=${season}`);
}

export async function getTeamRecentForm(teamId: number | string, targetDate: string) {
  const endDate = new Date(`${targetDate}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);

  const startDate = new Date(`${targetDate}T00:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 20);

  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);

  return fetchJson(`${MLB_BASE}/schedule?sportId=1&teamId=${teamId}&startDate=${start}&endDate=${end}`);
}

export async function getVenue(venueId: number | string) {
  return fetchJson(`${MLB_BASE}/venues/${venueId}`);
}

export async function getGameBoxscore(gamePk: number | string) {
  return fetchJson(`${MLB_BASE}/game/${gamePk}/boxscore`);
}

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

export type OddsFetchResult = {
  marketSource: 'api' | 'no_data';
  commenceTimeFrom: string;
  commenceTimeTo: string;
  rawCount: number;
  oddsByGame: Record<string, MarketSummary>;
};

const TEAM_ALIAS_MAP: Record<string, string[]> = {
  'arizona diamondbacks': ['애리조나 다이아몬드백스', '애리조나', '다이아몬드백스'],
  'atlanta braves': ['애틀랜타 브레이브스', '애틀랜타', '브레이브스'],
  'baltimore orioles': ['볼티모어 오리올스', '볼티모어', '오리올스'],
  'boston red sox': ['보스턴 레드삭스', '보스턴', '레드삭스'],
  'chicago cubs': ['시카고 컵스', '컵스'],
  'chicago white sox': ['시카고 화이트삭스', '화이트삭스'],
  'cincinnati reds': ['신시내티 레즈', '신시내티', '레즈'],
  'cleveland guardians': ['클리블랜드 가디언스', '클리블랜드', '가디언스'],
  'colorado rockies': ['콜로라도 로키스', '콜로라도', '로키스'],
  'detroit tigers': ['디트로이트 타이거스', '디트로이트', '타이거스'],
  'houston astros': ['휴스턴 애스트로스', '휴스턴', '애스트로스'],
  'kansas city royals': ['캔자스시티 로열스', '캔자스시티', '로열스'],
  'los angeles angels': ['la 에인절스', '로스앤젤레스 에인절스', '에인절스'],
  'los angeles dodgers': ['la 다저스', '로스앤젤레스 다저스', '다저스'],
  'miami marlins': ['마이애미 말린스', '마이애미', '말린스'],
  'milwaukee brewers': ['밀워키 브루어스', '밀워키', '브루어스'],
  'minnesota twins': ['미네소타 트윈스', '미네소타', '트윈스'],
  'new york mets': ['뉴욕 메츠', '메츠'],
  'new york yankees': ['뉴욕 양키스', '양키스'],
  'oakland athletics': ['오클랜드 애슬레틱스', '오클랜드', '애슬레틱스', '애슬레틱'],
  'philadelphia phillies': ['필라델피아 필리스', '필라델피아', '필리스'],
  'pittsburgh pirates': ['피츠버그 파이리츠', '피츠버그', '파이리츠'],
  'san diego padres': ['샌디에이고 파드리스', '샌디에이고', '파드리스'],
  'san francisco giants': ['샌프란시스코 자이언츠', '샌프란시스코', '자이언츠'],
  'seattle mariners': ['시애틀 매리너스', '시애틀', '매리너스'],
  'st. louis cardinals': ['세인트루이스 카디널스', '세인트루이스', '카디널스'],
  'tampa bay rays': ['탬파베이 레이스', '탬파베이', '레이스'],
  'texas rangers': ['텍사스 레인저스', '텍사스', '레인저스'],
  'toronto blue jays': ['토론토 블루제이스', '토론토', '블루제이스'],
  'washington nationals': ['워싱턴 내셔널스', '워싱턴', '내셔널스'],
};

function safeIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function shiftDateString(dateStr: string, offsetDays: number) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function buildOddsApiWindow(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00Z`);
  const end = new Date(`${dateStr}T23:59:59Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('invalid date query');
  }

  return {
    commenceTimeFrom: safeIso(start),
    commenceTimeTo: safeIso(end),
  };
}

function normalizeName(name?: string | null) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function aliasesForTeam(teamName: string) {
  const normalized = normalizeName(teamName);
  const pieces = normalized.split(' ');
  const lastWord = pieces[pieces.length - 1] || normalized;
  return unique([normalized, ...((TEAM_ALIAS_MAP[normalized] || []).map(normalizeName)), lastWord]);
}

function findOutcomeByName(outcomes: any[], teamName: string) {
  const candidates = aliasesForTeam(teamName);
  return outcomes.find((o) => candidates.includes(normalizeName(o?.name)));
}

function summarizeMarkets(bookmakers: any[], homeTeam: string, awayTeam: string): MarketSummary | null {
  if (!Array.isArray(bookmakers) || bookmakers.length === 0) return null;

  const bookmaker = bookmakers[0];
  const markets = Array.isArray(bookmaker?.markets) ? bookmaker.markets : [];

  const h2h = markets.find((m: any) => m?.key === 'h2h');
  const spreads = markets.find((m: any) => m?.key === 'spreads');
  const totals = markets.find((m: any) => m?.key === 'totals');

  const h2hOutcomes = Array.isArray(h2h?.outcomes) ? h2h.outcomes : [];
  const spreadOutcomes = Array.isArray(spreads?.outcomes) ? spreads.outcomes : [];
  const totalOutcomes = Array.isArray(totals?.outcomes) ? totals.outcomes : [];

  const homeH2h = findOutcomeByName(h2hOutcomes, homeTeam);
  const awayH2h = findOutcomeByName(h2hOutcomes, awayTeam);
  const homeSpread = findOutcomeByName(spreadOutcomes, homeTeam);
  const awaySpread = findOutcomeByName(spreadOutcomes, awayTeam);
  const over = totalOutcomes.find((o: any) => normalizeName(o?.name) === 'over');
  const under = totalOutcomes.find((o: any) => normalizeName(o?.name) === 'under');

  return {
    bookmaker: bookmaker?.title || 'unknown',
    lastUpdate: bookmaker?.last_update || null,
    homeMoneyline: typeof homeH2h?.price === 'number' ? homeH2h.price : null,
    awayMoneyline: typeof awayH2h?.price === 'number' ? awayH2h.price : null,
    homeSpreadPoint: typeof homeSpread?.point === 'number' ? homeSpread.point : null,
    homeSpreadPrice: typeof homeSpread?.price === 'number' ? homeSpread.price : null,
    awaySpreadPoint: typeof awaySpread?.point === 'number' ? awaySpread.point : null,
    awaySpreadPrice: typeof awaySpread?.price === 'number' ? awaySpread.price : null,
    overPoint: typeof over?.point === 'number' ? over.point : null,
    overPrice: typeof over?.price === 'number' ? over.price : null,
    underPoint: typeof under?.point === 'number' ? under.point : null,
    underPrice: typeof under?.price === 'number' ? under.price : null,
  };
}

function keyCandidates(homeTeam: string, awayTeam: string) {
  const homeAliases = aliasesForTeam(homeTeam);
  const awayAliases = aliasesForTeam(awayTeam);
  const keys: string[] = [];

  for (const home of homeAliases) {
    for (const away of awayAliases) {
      keys.push(`${away} @ ${home}`);
      keys.push(`${home} vs ${away}`);
      keys.push(`${away} at ${home}`);
      keys.push(`${home}|${away}`);
      keys.push(`${away}|${home}`);
      keys.push(`${home} ${away}`);
      keys.push(`${away} ${home}`);
    }
  }

  return unique(keys);
}

export async function getMlbOdds() {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return [];

  return fetchJson(
    `${ODDS_BASE}/sports/baseball_mlb/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`
  );
}

async function fetchOddsForSingleDate(dateStr: string, apiKey: string): Promise<OddsFetchResult> {
  const { commenceTimeFrom, commenceTimeTo } = buildOddsApiWindow(dateStr);

  const url = new URL(`${ODDS_BASE}/sports/baseball_mlb/odds`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', 'h2h,spreads,totals');
  url.searchParams.set('oddsFormat', 'american');
  url.searchParams.set('dateFormat', 'iso');
  url.searchParams.set('commenceTimeFrom', commenceTimeFrom);
  url.searchParams.set('commenceTimeTo', commenceTimeTo);

  const response = await fetch(url.toString(), { cache: 'no-store' });
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(rawText || `odds api error: ${response.status}`);
  }

  const json = rawText ? JSON.parse(rawText) : [];
  const events = Array.isArray(json) ? json : [];
  const oddsByGame: Record<string, MarketSummary> = {};

  for (const event of events) {
    const homeTeam = event?.home_team || '';
    const awayTeam = event?.away_team || '';
    if (!homeTeam || !awayTeam) continue;

    const summary = summarizeMarkets(event?.bookmakers || [], homeTeam, awayTeam);
    if (!summary) continue;

    for (const key of keyCandidates(homeTeam, awayTeam)) {
      oddsByGame[key] = summary;
    }
  }

  return {
    marketSource: Object.keys(oddsByGame).length > 0 ? 'api' : 'no_data',
    commenceTimeFrom,
    commenceTimeTo,
    rawCount: events.length,
    oddsByGame,
  };
}

export async function fetchMlbOddsByDate(dateStr: string, apiKey: string): Promise<OddsFetchResult> {
  // Korea-local schedule dates often map to the previous UTC date in The Odds API.
  const targetDates = [shiftDateString(dateStr, -1), dateStr, shiftDateString(dateStr, 1)];
  const merged: Record<string, MarketSummary> = {};
  let rawCount = 0;
  let marketSource: 'api' | 'no_data' = 'no_data';

  for (const targetDate of targetDates) {
    const result = await fetchOddsForSingleDate(targetDate, apiKey);
    rawCount += result.rawCount;
    if (result.marketSource === 'api') {
      marketSource = 'api';
    }
    Object.assign(merged, result.oddsByGame);
  }

  const firstWindow = buildOddsApiWindow(targetDates[0]);
  const lastWindow = buildOddsApiWindow(targetDates[targetDates.length - 1]);

  return {
    marketSource,
    commenceTimeFrom: firstWindow.commenceTimeFrom,
    commenceTimeTo: lastWindow.commenceTimeTo,
    rawCount,
    oddsByGame: merged,
  };
}
