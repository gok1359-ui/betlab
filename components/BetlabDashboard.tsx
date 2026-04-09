'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONFIG, normalizeConfig, type BetlabConfig } from '@/core/config/defaults';
import { buildGameAnalysis } from '@/core/engine/analyzeGame';
import { computeBBConfidence } from '@/core/engine/bbConfidence';
import { buildBBReason } from '@/core/engine/bbReason';
import { buildRecommendedSettings } from '@/core/tracking/recommendedSettings';
import { normalizeTeamName, teamNameKo } from '@/core/domain/teams';
import { getTrackingSummary } from '@/core/tracking/autoTrack';
import { buildDailyCacheKey, CACHE_TTL, readCache, writeCache } from '@/core/cache/apiCache';

type ScheduleResponse = {
  ok: boolean;
  data?: { dates?: Array<{ games?: Array<any> }> };
  error?: string;
};

type OddsResponse = {
  ok: boolean;
  data?: any[];
  oddsByGame?: Record<string, any>;
  hasApiKey?: boolean;
  error?: string;
};

type ResultsResponse = {
  ok: boolean;
  date?: string;
  results?: Array<{
    gamePk: number;
    isFinal: boolean;
    state: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    totalScore: number;
    margin: number;
  }>;
  error?: string;
};

type SavedAnalysis = {
  id: string;
  date: string;
  createdAt: string;
  gamePk: number;
  homeTeam: string;
  awayTeam: string;
  summary: string;
  marketType: 'moneyline' | 'spread' | 'total';
  bbValue: number;
  hasMarketOdds: boolean;
  bookmakerTitle: string | null;
  snapshot: {
    expectedHomeRuns: number;
    expectedAwayRuns: number;
    expectedMargin: number;
    expectedTotal: number;
  };
  oddsSummary: {
    homePrice: number | null;
    awayPrice: number | null;
    spreadHomePoint: number | null;
    spreadAwayPoint: number | null;
    totalLine: number | null;
  };
  result: ReturnType<typeof buildGameAnalysis>['result'] & {
    bbBreakdown?: Record<string, number>;
  };
};

type VerificationRecord = {
  analysisId: string;
  result: 'win' | 'loss' | 'push';
  checkedAt: string;
};

type RangeGameResult = {
  id: string;
  date: string;
  gamePk: number;
  homeTeam: string;
  awayTeam: string;
  headline: string;
  marketType: 'moneyline' | 'spread' | 'total';
  bbValue: number;
  hasMarketOdds: boolean;
  bookmakerTitle: string | null;
  expectedHomeRuns: number;
  expectedAwayRuns: number;
  expectedMargin: number;
  expectedTotal: number;
  oddsSummary: {
    homePrice: number | null;
    awayPrice: number | null;
    spreadHomePoint: number | null;
    spreadAwayPoint: number | null;
    totalLine: number | null;
  };
  bbBreakdown: {
    pitcher: number;
    form: number;
    batting: number;
    bullpen: number;
    lineup: number;
    park: number;
  };
  verificationResult?: 'win' | 'loss' | 'push';
};

type BbBucketStat = {
  label: string;
  min: number;
  max: number | null;
  total: number;
  wins: number;
  losses: number;
  pushes: number;
  rate: number;
};



type MarketStat = {
  total: number;
  wins: number;
  losses: number;
  pushes: number;
  rate: number;
  highBbMisses: number;
};

type MissReasonStat = {
  key: string;
  label: string;
  count: number;
};

type RangeAnalysisSummary = {
  totalGames: number;
  strongCount: number;
  mediumCount: number;
  weakCount: number;
  watchCount: number;
  marketConnectedCount: number;
  verifiedCount: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  highBbMisses: number;
  topGames: RangeGameResult[];
  byDate: Array<{
    date: string;
    games: number;
    strong: number;
    medium: number;
    weak: number;
    watch: number;
    verified: number;
    wins: number;
    losses: number;
  }>;
  bbBuckets: BbBucketStat[];
  marketStats: {
    moneyline: MarketStat;
    spread: MarketStat;
    total: MarketStat;
  };
  missReasons: MissReasonStat[];
  highBbMissGames: Array<{
    id: string;
    date: string;
    matchup: string;
    bbValue: number;
    reason: string;
    topFactor: string;
    marketType: string;
  }>;
};

const CONFIG_KEY = 'betlab:web:config';
const SAVED_KEY = 'betlab:web:saved-analyses';
const FILTER_KEY = 'betlab:web:filters';
const VERIFY_KEY = 'betlab:web:verification';

const FACTOR_LABEL: Record<string, string> = {
  pitcher: '선발',
  form: '최근 흐름',
  batting: '타격',
  bullpen: '불펜',
  lineup: '라인업',
  park: '구장',
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function numberOr(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatBb(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

function formatOdds(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value > 0 ? `+${value}` : `${value}`;
}

function formatSigned(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value > 0 ? `+${value}` : `${value}`;
}

function gameLabel(game: any) {
  const away = normalizeTeamName(game?.teams?.away?.team?.name ?? 'Away');
  const home = normalizeTeamName(game?.teams?.home?.team?.name ?? 'Home');
  return `${teamNameKo(away)} @ ${teamNameKo(home)}`;
}

function gameTime(game: any) {
  try {
    return new Date(game?.gameDate).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function recommendationClass(level: string) {
  if (level === 'strong') return 'result-banner strong';
  if (level === 'weak') return 'result-banner weak';
  return 'result-banner';
}

function isPreGame(game: any) {
  const state = String(game?.status?.abstractGameState ?? game?.status?.detailedState ?? '').toLowerCase();
  return state.includes('pre') || state.includes('preview') || state.includes('scheduled');
}

function pickBestMarket(analysis: ReturnType<typeof buildGameAnalysis>) {
  const candidates = [
    { key: 'moneyline' as const, label: '머니라인', bb: Math.max(Math.abs(analysis.result.moneyline.homeBB), Math.abs(analysis.result.moneyline.awayBB)) },
    { key: 'spread' as const, label: '핸디캡', bb: Math.max(Math.abs(analysis.result.spread.homeBB), Math.abs(analysis.result.spread.awayBB)) },
    { key: 'total' as const, label: '언오버', bb: Math.max(Math.abs(analysis.result.total.overBB), Math.abs(analysis.result.total.underBB)) },
  ].sort((a, b) => b.bb - a.bb);
  return candidates[0];
}

function classifyBBStrength(bb: number) {
  if (bb >= 0.22) return { level: 'strong' as const, label: '강추천', tone: '🔥' };
  if (bb >= 0.12) return { level: 'medium' as const, label: '중추천', tone: '▲' };
  if (bb >= 0.06) return { level: 'weak' as const, label: '약추천', tone: '•' };
  return { level: 'watch' as const, label: '관찰', tone: '·' };
}

function buildRepresentativeHeadline(analysis: ReturnType<typeof buildGameAnalysis>) {
  const best = pickBestMarket(analysis);
  const strength = classifyBBStrength(best.bb);
  if (best.key === 'moneyline') {
    const homeBetter = analysis.result.moneyline.homeBB >= analysis.result.moneyline.awayBB;
    return `${best.label} ${homeBetter ? '홈' : '원정'} ${strength.label}`;
  }
  if (best.key === 'spread') {
    const homeBetter = analysis.result.spread.homeBB >= analysis.result.spread.awayBB;
    return `${best.label} ${homeBetter ? '홈' : '원정'} ${strength.label}`;
  }
  const overBetter = analysis.result.total.overBB >= analysis.result.total.underBB;
  return `${best.label} ${overBetter ? '오버' : '언더'} ${strength.label}`;
}

function toUiRecommendationLevel(level: 'strong' | 'medium' | 'weak' | 'watch'): 'strong' | 'weak' | 'watch' {
  if (level === 'strong') return 'strong';
  if (level === 'watch') return 'watch';
  return 'weak';
}

function evaluateSavedAnalysis(
  item: {
    summary: string;
    marketType: 'moneyline' | 'spread' | 'total';
    oddsSummary: {
      spreadHomePoint: number | null;
      spreadAwayPoint: number | null;
      totalLine: number | null;
    };
  },
  result: { homeScore: number; awayScore: number; totalScore: number; margin: number }
): 'win' | 'loss' | 'push' {
  const summary = item.summary;
  if (item.marketType === 'moneyline') {
    const pickedHome = summary.includes('홈');
    if (result.homeScore === result.awayScore) return 'push';
    const homeWon = result.homeScore > result.awayScore;
    return pickedHome === homeWon ? 'win' : 'loss';
  }
  if (item.marketType === 'spread') {
    const pickedHome = summary.includes('홈');
    const line = pickedHome ? Number(item.oddsSummary.spreadHomePoint ?? -1.5) : Number(item.oddsSummary.spreadAwayPoint ?? 1.5);
    const adjusted = pickedHome ? result.margin + line : -result.margin + line;
    if (Math.abs(adjusted) < 1e-9) return 'push';
    return adjusted > 0 ? 'win' : 'loss';
  }
  const pickedOver = summary.includes('오버');
  const line = Number(item.oddsSummary.totalLine ?? 8.5);
  if (Math.abs(result.totalScore - line) < 1e-9) return 'push';
  return pickedOver ? (result.totalScore > line ? 'win' : 'loss') : (result.totalScore < line ? 'win' : 'loss');
}

function buildBbBuckets(games: RangeGameResult[]): BbBucketStat[] {
  const buckets = [
    { label: 'BB 0.25+', min: 0.25, max: null },
    { label: 'BB 0.15~0.25', min: 0.15, max: 0.25 },
    { label: 'BB 0.05~0.15', min: 0.05, max: 0.15 },
    { label: 'BB 0.00~0.05', min: 0.00, max: 0.05 },
  ];

  return buckets.map((bucket) => {
    const items = games.filter((g) => {
      if (!g.verificationResult) return false;
      if (bucket.max == null) return g.bbValue >= bucket.min;
      return g.bbValue >= bucket.min && g.bbValue < bucket.max;
    });
    const wins = items.filter((g) => g.verificationResult === 'win').length;
    const losses = items.filter((g) => g.verificationResult === 'loss').length;
    const pushes = items.filter((g) => g.verificationResult === 'push').length;
    return {
      ...bucket,
      total: items.length,
      wins,
      losses,
      pushes,
      rate: items.length ? wins / items.length : 0,
    };
  });
}

function classifyMissReason(game: RangeGameResult): { key: string; label: string; topFactor: string } {
  const entries = Object.entries(game.bbBreakdown || {})
    .map(([key, value]) => ({ key, value: Number(value) || 0 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const top = entries[0];
  const second = entries[1];
  const topLabel = top ? FACTOR_LABEL[top.key] ?? top.key : '-';

  if (!top) {
    return { key: 'unknown', label: '요인 부족', topFactor: '-' };
  }

  if (top.key === 'pitcher') {
    return { key: 'pitcher_over', label: '선발 과대평가', topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}` };
  }
  if (top.key === 'bullpen') {
    return { key: 'bullpen_over', label: '불펜 과대평가', topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}` };
  }
  if (top.key === 'batting') {
    return { key: 'batting_over', label: '타격 과대평가', topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}` };
  }
  if (top.key === 'form') {
    return { key: 'form_over', label: '최근 흐름 과신', topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}` };
  }
  if (top.key === 'park') {
    return { key: 'park_noise', label: '구장 영향 과대반영', topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}` };
  }
  if (top.key === 'lineup') {
    return { key: 'lineup_noise', label: '라인업 영향 과대반영', topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}` };
  }

  return {
    key: 'mixed',
    label: second ? `복합 요인 (${topLabel}/${FACTOR_LABEL[second.key] ?? second.key})` : '복합 요인',
    topFactor: `${topLabel} ${top.value >= 0 ? '+' : ''}${top.value.toFixed(2)}`,
  };
}

function buildMissReasonStats(games: RangeGameResult[]) {
  const misses = games.filter((g) => g.verificationResult === 'loss' && g.bbValue >= 0.2);
  const counter = new Map<string, { key: string; label: string; count: number }>();
  const missGames = misses.map((g) => {
    const reason = classifyMissReason(g);
    const prev = counter.get(reason.key);
    counter.set(reason.key, {
      key: reason.key,
      label: reason.label,
      count: (prev?.count ?? 0) + 1,
    });
    return {
      id: g.id,
      date: g.date,
      matchup: `${teamNameKo(g.awayTeam)} @ ${teamNameKo(g.homeTeam)}`,
      bbValue: g.bbValue,
      reason: reason.label,
      topFactor: reason.topFactor,
      marketType: g.marketType,
    };
  });

  return {
    stats: [...counter.values()].sort((a, b) => b.count - a.count),
    games: missGames.slice(0, 12),
  };
}



function buildMarketStats(games: RangeGameResult[]) {
  const buildOne = (marketType: 'moneyline' | 'spread' | 'total'): MarketStat => {
    const items = games.filter((g) => g.marketType === marketType && g.verificationResult);
    const wins = items.filter((g) => g.verificationResult === 'win').length;
    const losses = items.filter((g) => g.verificationResult === 'loss').length;
    const pushes = items.filter((g) => g.verificationResult === 'push').length;
    return {
      total: items.length,
      wins,
      losses,
      pushes,
      rate: items.length ? wins / items.length : 0,
      highBbMisses: items.filter((g) => g.verificationResult === 'loss' && g.bbValue >= 0.2).length,
    };
  };

  return {
    moneyline: buildOne('moneyline'),
    spread: buildOne('spread'),
    total: buildOne('total'),
  };
}

function buildEmptyRangeSummary(): RangeAnalysisSummary {
  return {
    totalGames: 0,
    strongCount: 0,
    mediumCount: 0,
    weakCount: 0,
    watchCount: 0,
    marketConnectedCount: 0,
    verifiedCount: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    winRate: 0,
    highBbMisses: 0,
    topGames: [],
    byDate: [],
    bbBuckets: [],
    marketStats: {
      moneyline: { total: 0, wins: 0, losses: 0, pushes: 0, rate: 0, highBbMisses: 0 },
      spread: { total: 0, wins: 0, losses: 0, pushes: 0, rate: 0, highBbMisses: 0 },
      total: { total: 0, wins: 0, losses: 0, pushes: 0, rate: 0, highBbMisses: 0 },
    },
    missReasons: [],
    highBbMissGames: [],
  };
}

function enumerateDates(start: string, end: string) {
  const dates: string[] = [];
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return dates;
  const cur = new Date(s);
  while (cur <= e) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function isHistoricalDate(date: string) {
  return date < todayString();
}

async function fetchScheduleCached(date: string): Promise<ScheduleResponse> {
  const key = buildDailyCacheKey('schedule', date);
  const cached = readCache<ScheduleResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/mlb/schedule?date=${date}`);
  const json = await res.json() as ScheduleResponse;
  if (json.ok) writeCache(key, json, CACHE_TTL.schedule);
  return json;
}

async function fetchOddsCached(date: string): Promise<OddsResponse> {
  const key = buildDailyCacheKey('odds', date);
  const cached = readCache<OddsResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/mlb/odds?date=${date}`);
  const json = await res.json() as OddsResponse;
  if (json.ok) writeCache(key, json, isHistoricalDate(date) ? CACHE_TTL.oddsHistorical : CACHE_TTL.oddsRecent);
  return json;
}

async function fetchResultsCached(date: string): Promise<ResultsResponse> {
  const key = buildDailyCacheKey('results', date);
  const cached = readCache<ResultsResponse>(key);
  if (cached) return cached;
  const res = await fetch(`/api/mlb/results?date=${date}`);
  const json = await res.json() as ResultsResponse;
  if (json.ok) writeCache(key, json, isHistoricalDate(date) ? CACHE_TTL.resultsHistorical : CACHE_TTL.resultsRecent);
  return json;
}

export default function BetlabDashboard() {
  const [date, setDate] = useState(todayString());
  const [rangeStart, setRangeStart] = useState(todayString());
  const [rangeEnd, setRangeEnd] = useState(todayString());
  const [config, setConfig] = useState<BetlabConfig>(DEFAULT_CONFIG);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [oddsData, setOddsData] = useState<any>([]);
  const [selectedGamePk, setSelectedGamePk] = useState<number | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [detailView, setDetailView] = useState<SavedAnalysis | null>(null);
  const [verification, setVerification] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('관리자 페이지 준비됨');
  const [pregameOnly, setPregameOnly] = useState(true);
  const [strongOnly, setStrongOnly] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'all' | 'moneyline' | 'spread' | 'total'>('all');
  const [sortMode, setSortMode] = useState<'time' | 'bb'>('time');
  const [savedDateMode, setSavedDateMode] = useState<'selected' | 'all'>('selected');
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeSummary, setRangeSummary] = useState<RangeAnalysisSummary>(buildEmptyRangeSummary());
  const [rangeStatus, setRangeStatus] = useState('범위 분석 대기중');

  useEffect(() => {
    setConfig(normalizeConfig(readStorage(CONFIG_KEY, DEFAULT_CONFIG)));
    setSavedAnalyses(readStorage<SavedAnalysis[]>(SAVED_KEY, []));
    setVerification(readStorage<VerificationRecord[]>(VERIFY_KEY, []));
    const filters = readStorage(FILTER_KEY, {
      pregameOnly: true,
      strongOnly: false,
      marketFilter: 'all' as 'all' | 'moneyline' | 'spread' | 'total',
      sortMode: 'time' as 'time' | 'bb',
      savedDateMode: 'selected' as 'selected' | 'all',
    });
    setPregameOnly(Boolean(filters.pregameOnly));
    setStrongOnly(Boolean(filters.strongOnly));
    setMarketFilter(filters.marketFilter ?? 'all');
    setSortMode(filters.sortMode ?? 'time');
    setSavedDateMode(filters.savedDateMode ?? 'selected');
  }, []);

  useEffect(() => {
    setRangeStart(date);
    setRangeEnd(date);
  }, [date]);

  async function loadGames() {
    setLoading(true);
    setStatus('일정과 배당을 불러오는 중...');
    try {
      const [scheduleRes, oddsRes] = await Promise.all([
        fetchScheduleCached(date),
        fetchOddsCached(date),
      ]);

      if (!scheduleRes.ok) throw new Error(scheduleRes.error ?? '일정 조회 실패');
      if (!oddsRes.ok) throw new Error(oddsRes.error ?? '배당 조회 실패');

      const games = (scheduleRes.data?.dates ?? []).flatMap((d) => d.games ?? []);
      const sortedGames = [...games].sort((a, b) => new Date(a?.gameDate).getTime() - new Date(b?.gameDate).getTime());
      const preGameGames = sortedGames.filter((game) => isPreGame(game));

      setSchedule(sortedGames);
      setOddsData(oddsRes.oddsByGame ?? oddsRes.data ?? []);
      setSelectedGamePk((current) => current ?? (preGameGames[0]?.gamePk ?? sortedGames[0]?.gamePk ?? null));
      setStatus(
        oddsRes.hasApiKey
          ? `불러오기 완료: ${sortedGames.length}경기 · 프리게임 ${preGameGames.length}경기 · 실배당 사용 (캐시 포함)`
          : `불러오기 완료: ${sortedGames.length}경기 · 프리게임 ${preGameGames.length}경기 · 기본 배당 사용 (캐시 포함)`
      );
    } catch (error) {
      setSchedule([]);
      setOddsData([]);
      setStatus(error instanceof Error ? error.message : '로딩 실패');
    } finally {
      setLoading(false);
    }
  }

  async function runRangeAnalyzer() {
    if (!rangeStart || !rangeEnd) {
      setRangeStatus('시작일과 종료일을 먼저 넣어줘');
      return;
    }
    if (rangeStart > rangeEnd) {
      setRangeStatus('시작일이 종료일보다 늦을 수는 없어');
      return;
    }

    const dateList = enumerateDates(rangeStart, rangeEnd);
    if (!dateList.length) {
      setRangeStatus('유효한 범위가 아니야');
      return;
    }

    setRangeLoading(true);
    setRangeStatus(`범위 분석 시작 · ${dateList.length}일 처리중...`);

    try {
      const allGames: RangeGameResult[] = [];
      const byDate: RangeAnalysisSummary['byDate'] = [];

      for (let i = 0; i < dateList.length; i += 1) {
        const targetDate = dateList[i];
        setRangeStatus(`범위 분석 진행중 · ${targetDate} (${i + 1}/${dateList.length})`);

        const [scheduleRes, oddsRes, resultsRes] = await Promise.all([
          fetchScheduleCached(targetDate),
          fetchOddsCached(targetDate),
          fetchResultsCached(targetDate).catch(() => ({ ok: false } as ResultsResponse)),
        ]);

        if (!scheduleRes.ok) continue;
        const scheduleGames = (scheduleRes.data?.dates ?? []).flatMap((d) => d.games ?? []);
        const oddsPayload = oddsRes.ok ? (oddsRes.oddsByGame ?? oddsRes.data ?? []) : [];
        const resultMap = new Map((resultsRes.ok ? (resultsRes.results ?? []) : []).map((r) => [r.gamePk, r]));

        let strong = 0;
        let medium = 0;
        let weak = 0;
        let watch = 0;
        let verified = 0;
        let wins = 0;
        let losses = 0;

        for (const game of scheduleGames) {
          const analysis = buildGameAnalysis({ game, schedule: scheduleGames, oddsData: oddsPayload, config });
          const best = pickBestMarket(analysis);
          const strength = classifyBBStrength(best.bb);

          if (strength.level === 'strong') strong += 1;
          else if (strength.level === 'medium') medium += 1;
          else if (strength.level === 'weak') weak += 1;
          else watch += 1;

          const headline = buildRepresentativeHeadline(analysis);

          const item: RangeGameResult = {
            id: `${targetDate}-${game.gamePk}`,
            date: targetDate,
            gamePk: game.gamePk ?? 0,
            homeTeam: game.teams?.home?.team?.name ?? 'Home',
            awayTeam: game.teams?.away?.team?.name ?? 'Away',
            headline,
            marketType: best.key,
            bbValue: best.bb,
            hasMarketOdds: analysis.market.hasMarketOdds,
            bookmakerTitle: analysis.market.bookmakerTitle ?? null,
            expectedHomeRuns: analysis.result.expectedHomeRuns,
            expectedAwayRuns: analysis.result.expectedAwayRuns,
            expectedMargin: analysis.result.expectedMargin,
            expectedTotal: analysis.result.expectedTotal,
            oddsSummary: {
              homePrice: analysis.market.rawHomePrice ?? null,
              awayPrice: analysis.market.rawAwayPrice ?? null,
              spreadHomePoint: analysis.result.spread?.homePoint ?? null,
              spreadAwayPoint: analysis.result.spread?.awayPoint ?? null,
              totalLine: analysis.result.total?.line ?? null,
            },
            bbBreakdown: analysis.bbBreakdown,
          };

          const actual = resultMap.get(game.gamePk ?? -1);
          if (actual?.isFinal) {
            item.verificationResult = evaluateSavedAnalysis(
              {
                summary: headline,
                marketType: best.key,
                oddsSummary: item.oddsSummary,
              },
              {
                homeScore: actual.homeScore,
                awayScore: actual.awayScore,
                totalScore: actual.totalScore,
                margin: actual.margin,
              }
            );
            verified += 1;
            if (item.verificationResult === 'win') wins += 1;
            if (item.verificationResult === 'loss') losses += 1;
          }

          allGames.push(item);
        }

        byDate.push({
          date: targetDate,
          games: scheduleGames.length,
          strong,
          medium,
          weak,
          watch,
          verified,
          wins,
          losses,
        });
      }

      const verifiedGames = allGames.filter((g) => g.verificationResult);
      const wins = verifiedGames.filter((g) => g.verificationResult === 'win').length;
      const losses = verifiedGames.filter((g) => g.verificationResult === 'loss').length;
      const pushes = verifiedGames.filter((g) => g.verificationResult === 'push').length;
      const missReasonResult = buildMissReasonStats(allGames);
      const marketStats = buildMarketStats(allGames);

      const summary: RangeAnalysisSummary = {
        totalGames: allGames.length,
        strongCount: allGames.filter((g) => g.bbValue >= 0.22).length,
        mediumCount: allGames.filter((g) => g.bbValue >= 0.12 && g.bbValue < 0.22).length,
        weakCount: allGames.filter((g) => g.bbValue >= 0.06 && g.bbValue < 0.12).length,
        watchCount: allGames.filter((g) => g.bbValue < 0.06).length,
        marketConnectedCount: allGames.filter((g) => g.hasMarketOdds).length,
        verifiedCount: verifiedGames.length,
        wins,
        losses,
        pushes,
        winRate: verifiedGames.length ? wins / verifiedGames.length : 0,
        highBbMisses: allGames.filter((g) => g.verificationResult === 'loss' && g.bbValue >= 0.2).length,
        topGames: [...allGames].sort((a, b) => b.bbValue - a.bbValue).slice(0, 15),
        byDate,
        bbBuckets: buildBbBuckets(allGames),
        marketStats,
        missReasons: missReasonResult.stats,
        highBbMissGames: missReasonResult.games,
      };

      setRangeSummary(summary);
      setRangeStatus(`범위 분석 완료 · ${rangeStart}~${rangeEnd} · ${summary.totalGames}경기`);
    } catch (error) {
      setRangeStatus(error instanceof Error ? error.message : '범위 분석 실패');
      setRangeSummary(buildEmptyRangeSummary());
    } finally {
      setRangeLoading(false);
    }
  }

  async function autoApplyResults() {
    try {
      const data = await fetchResultsCached(date);
      if (!data.ok || !data.results) throw new Error(data.error ?? '결과 조회 실패');

      const finals = data.results.filter((item) => item.isFinal);
      if (!finals.length) {
        setStatus('자동 결과 반영 완료 · 종료 경기 없음');
        return;
      }

      const resultMap = new Map(finals.map((item) => [item.gamePk, item]));
      const targetSaved = savedAnalyses.filter((item) => item.date === date);

      let updatedCount = 0;
      const nextVerification = [...verification].filter((item) => {
        const found = targetSaved.find((saved) => saved.id === item.analysisId);
        return found ? !resultMap.has(found.gamePk) : true;
      });

      for (const saved of targetSaved) {
        const result = resultMap.get(saved.gamePk);
        if (!result) continue;
        nextVerification.unshift({
          analysisId: saved.id,
          result: evaluateSavedAnalysis(saved, result),
          checkedAt: new Date().toISOString(),
        });
        updatedCount += 1;
      }

      setVerification(nextVerification.slice(0, 1000));
      setStatus(`자동 결과 반영 완료 · ${updatedCount}건 업데이트`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '자동 결과 반영 실패');
    }
  }

  useEffect(() => {
    writeStorage(CONFIG_KEY, config);
  }, [config]);

  useEffect(() => {
    writeStorage(SAVED_KEY, savedAnalyses);
  }, [savedAnalyses]);

  useEffect(() => {
    writeStorage(VERIFY_KEY, verification);
  }, [verification]);

  useEffect(() => {
    writeStorage(FILTER_KEY, {
      pregameOnly,
      strongOnly,
      marketFilter,
      sortMode,
      savedDateMode,
    });
  }, [pregameOnly, strongOnly, marketFilter, sortMode, savedDateMode]);

  useEffect(() => {
    loadGames();
  }, []);

  const precomputedAnalyses = useMemo(() => {
    return schedule.map((game) => {
      const analysis = buildGameAnalysis({ game, schedule, oddsData, config });
      const best = pickBestMarket(analysis);
      const strength = classifyBBStrength(best.bb);

      return {
        game,
        analysis: {
          ...analysis,
          recommendation: {
            ...analysis.recommendation,
            level: toUiRecommendationLevel(strength.level),
            headline: buildRepresentativeHeadline(analysis),
            description: analysis.market.hasMarketOdds
              ? `시장 배당 연결 · ${best.label} BB ${formatBb(best.bb)}`
              : `기본 배당 기준 · ${best.label} BB ${formatBb(best.bb)}`,
          },
          bbBreakdown: analysis.bbBreakdown,
        },
      };
    });
  }, [schedule, oddsData, config]);

  useEffect(() => {
    if (!precomputedAnalyses.length) return;

    const autoSaved: SavedAnalysis[] = precomputedAnalyses.map(({ game, analysis }) => {
      const best = pickBestMarket(analysis);
      return {
        id: `${date}-${game.gamePk}-auto`,
        date,
        createdAt: new Date().toISOString(),
        gamePk: game.gamePk,
        homeTeam: game.teams?.home?.team?.name ?? 'Home',
        awayTeam: game.teams?.away?.team?.name ?? 'Away',
        summary: analysis.recommendation.headline,
        marketType: best.key,
        bbValue: best.bb,
        hasMarketOdds: analysis.market.hasMarketOdds,
        bookmakerTitle: analysis.market.bookmakerTitle ?? null,
        snapshot: {
          expectedHomeRuns: analysis.result.expectedHomeRuns,
          expectedAwayRuns: analysis.result.expectedAwayRuns,
          expectedMargin: analysis.result.expectedMargin,
          expectedTotal: analysis.result.expectedTotal,
        },
        oddsSummary: {
          homePrice: analysis.market.rawHomePrice ?? null,
          awayPrice: analysis.market.rawAwayPrice ?? null,
          spreadHomePoint: analysis.result.spread?.homePoint ?? null,
          spreadAwayPoint: analysis.result.spread?.awayPoint ?? null,
          totalLine: analysis.result.total?.line ?? null,
        },
        result: {
          ...analysis.result,
          bbBreakdown: analysis.bbBreakdown,
        } as any,
      };
    });

    setSavedAnalyses((current) => {
      const notSameDateAuto = current.filter((item) => !(item.id.endsWith('-auto') && item.date === date));
      const merged = [...autoSaved, ...notSameDateAuto];
      const dedup = new Map<string, SavedAnalysis>();
      for (const item of merged) dedup.set(item.id, item);
      return Array.from(dedup.values()).slice(0, 300);
    });
  }, [precomputedAnalyses, date]);

  const filteredEntries = useMemo(() => {
    const filtered = precomputedAnalyses.filter(({ game, analysis }) => {
      if (pregameOnly && !isPreGame(game)) return false;
      if (strongOnly) {
        const best = pickBestMarket(analysis);
        if (classifyBBStrength(best.bb).level !== 'strong') return false;
      }
      if (marketFilter !== 'all') {
        const best = pickBestMarket(analysis);
        if (best.key !== marketFilter) return false;
      }
      return true;
    });

    if (sortMode === 'bb') {
      return [...filtered].sort((a, b) => pickBestMarket(b.analysis).bb - pickBestMarket(a.analysis).bb);
    }
    return filtered;
  }, [precomputedAnalyses, pregameOnly, strongOnly, marketFilter, sortMode]);

  const selectedEntry = useMemo(() => {
    return filteredEntries.find(({ game }) => game.gamePk === selectedGamePk)
      ?? precomputedAnalyses.find(({ game }) => game.gamePk === selectedGamePk)
      ?? filteredEntries[0]
      ?? precomputedAnalyses[0]
      ?? null;
  }, [filteredEntries, precomputedAnalyses, selectedGamePk]);

  const selectedGame = selectedEntry?.game ?? null;
  const analysisBundle = selectedEntry?.analysis ?? null;

  const visibleSavedAnalyses = useMemo(() => {
    const list = savedDateMode === 'selected' ? savedAnalyses.filter((item) => item.date === date) : savedAnalyses;
    return [...list].sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.createdAt.localeCompare(a.createdAt)));
  }, [savedAnalyses, savedDateMode, date]);

  const trackingSummary = useMemo(() => {
    return getTrackingSummary(savedDateMode === 'selected' ? date : undefined);
  }, [date, savedDateMode, visibleSavedAnalyses.length, verification.length]);

  const rangeRecommendedSettings = useMemo(() => {
    const syntheticAnalyses = rangeSummary.topGames.map((g) => ({
      id: g.id,
      date: g.date,
      result: { bbBreakdown: g.bbBreakdown },
    }));
    const syntheticVerification = rangeSummary.topGames
      .filter((g) => g.verificationResult)
      .map((g) => ({
        analysisId: g.id,
        result: g.verificationResult as 'win' | 'loss' | 'push',
      }));
    return buildRecommendedSettings(config as any, syntheticAnalyses as any, syntheticVerification as any, {
      startDate: rangeStart,
      endDate: rangeEnd,
    });
  }, [config, rangeSummary, rangeStart, rangeEnd]);

  useEffect(() => {
    if (!selectedEntry) {
      setSelectedGamePk(null);
      return;
    }
    if (selectedGamePk !== selectedEntry.game.gamePk) {
      setSelectedGamePk(selectedEntry.game.gamePk);
    }
  }, [selectedEntry, selectedGamePk]);

  function saveCurrentAnalysis() {
    if (!selectedGame || !analysisBundle) return;
    const best = pickBestMarket(analysisBundle);

    const record: SavedAnalysis = {
      id: `${selectedGame.gamePk}-${Date.now()}`,
      date,
      createdAt: new Date().toISOString(),
      gamePk: selectedGame.gamePk,
      homeTeam: selectedGame.teams?.home?.team?.name ?? 'Home',
      awayTeam: selectedGame.teams?.away?.team?.name ?? 'Away',
      summary: analysisBundle.recommendation.headline,
      marketType: best.key,
      bbValue: best.bb,
      hasMarketOdds: analysisBundle.market.hasMarketOdds,
      bookmakerTitle: analysisBundle.market.bookmakerTitle ?? null,
      snapshot: {
        expectedHomeRuns: analysisBundle.result.expectedHomeRuns,
        expectedAwayRuns: analysisBundle.result.expectedAwayRuns,
        expectedMargin: analysisBundle.result.expectedMargin,
        expectedTotal: analysisBundle.result.expectedTotal,
      },
      oddsSummary: {
        homePrice: analysisBundle.market.rawHomePrice ?? null,
        awayPrice: analysisBundle.market.rawAwayPrice ?? null,
        spreadHomePoint: analysisBundle.result.spread?.homePoint ?? null,
        spreadAwayPoint: analysisBundle.result.spread?.awayPoint ?? null,
        totalLine: analysisBundle.result.total?.line ?? null,
      },
      result: {
        ...analysisBundle.result,
        bbBreakdown: analysisBundle.bbBreakdown,
      } as any,
    };

    setSavedAnalyses((current) => [record, ...current].slice(0, 300));
    setStatus('현재 분석 저장 완료');
  }

  const bb = analysisBundle?.bbBreakdown ?? { pitcher: 0, form: 0, batting: 0, bullpen: 0, lineup: 0, park: 0 };
  const confidence = computeBBConfidence(bb);
  const reason = buildBBReason(bb);

  return (
    <div className="page-shell admin-shell">
      <header className="hero-card admin-hero">
        <div>
          <p className="eyebrow">BetLab Admin</p>
          <h1>관리자 페이지 · 일정 로드 / 분석 / 저장 / 검증</h1>
          <p className="muted">고BB 미적중 원인 분류까지 붙인 관리자 화면이다.</p>
        </div>
        <div className="hero-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button onClick={loadGames} disabled={loading}>{loading ? '불러오는 중' : '경기 불러오기'}</button>
          <button onClick={autoApplyResults}>결과 자동 반영</button>
        </div>
      </header>

      <section className="grid two-col">
        <div className="card tall-card">
          <div className="card-header card-header-stack">
            <div>
              <h2>경기 목록</h2>
              <span>{status}</span>
            </div>
            <div className="toggle-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <label className="toggle-chip"><input type="checkbox" checked={pregameOnly} onChange={(e) => setPregameOnly(e.target.checked)} />프리게임만</label>
              <label className="toggle-chip"><input type="checkbox" checked={strongOnly} onChange={(e) => setStrongOnly(e.target.checked)} />강추천만</label>
              <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value as 'all' | 'moneyline' | 'spread' | 'total')}>
                <option value="all">전체 시장</option>
                <option value="moneyline">머니라인 우선</option>
                <option value="spread">핸디캡 우선</option>
                <option value="total">언오버 우선</option>
              </select>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'time' | 'bb')}>
                <option value="time">시간순</option>
                <option value="bb">BB 높은순</option>
              </select>
            </div>
          </div>

          <div className="ops-note" style={{ marginBottom: 12 }}>
            <ul className="plain-list">
              <li>강추천: BB 0.22 이상</li>
              <li>중추천: BB 0.12 이상</li>
              <li>약추천: BB 0.06 이상</li>
              <li>관찰: BB 0.06 미만</li>
            </ul>
          </div>

          <div className="game-list">
            {filteredEntries.length === 0 ? <p className="empty">현재 필터에 맞는 경기가 없다.</p> : filteredEntries.map(({ game, analysis }) => {
              const away = normalizeTeamName(game?.teams?.away?.team?.name ?? 'Away');
              const home = normalizeTeamName(game?.teams?.home?.team?.name ?? 'Home');
              const awayPitcher = game?.teams?.away?.probablePitcher?.fullName ?? '미정';
              const homePitcher = game?.teams?.home?.probablePitcher?.fullName ?? '미정';
              const state = game?.status?.detailedState ?? game?.status?.abstractGameState ?? '-';
              const best = pickBestMarket(analysis);
              const strength = classifyBBStrength(best.bb);

              return (
                <button key={game.gamePk} className={`game-item ${selectedGamePk === game.gamePk ? 'active' : ''}`} onClick={() => setSelectedGamePk(game.gamePk)}>
                  <strong>{teamNameKo(away)} @ {teamNameKo(home)}</strong>
                  <span>{gameTime(game)}</span>
                  <span>선발: {awayPitcher} / {homePitcher}</span>
                  <span>상태: {state}</span>
                  <small className="game-item-tag">{strength.tone} {analysis.recommendation.headline} · {best.label} BB {formatBb(best.bb)}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card tall-card">
          <div className="card-header">
            <h2>운영 설정</h2>
            <button className="ghost" onClick={() => setConfig(DEFAULT_CONFIG)}>기본값 복원</button>
          </div>
          <div className="settings-grid">
            <label>homeAdvantage<input type="number" step="0.01" value={config.homeAdvantage} onChange={(e) => setConfig({ ...config, homeAdvantage: numberOr(e.target.value, config.homeAdvantage) })} /></label>
            <label>strong<input type="number" step="0.1" value={config.bbThreshold.strong} onChange={(e) => setConfig({ ...config, bbThreshold: { ...config.bbThreshold, strong: numberOr(e.target.value, config.bbThreshold.strong) } })} /></label>
            <label>weak<input type="number" step="0.1" value={config.bbThreshold.weak} onChange={(e) => setConfig({ ...config, bbThreshold: { ...config.bbThreshold, weak: numberOr(e.target.value, config.bbThreshold.weak) } })} /></label>
            <label>baseRuns<input type="number" step="0.1" value={config.scoring.baseRuns} onChange={(e) => setConfig({ ...config, scoring: { ...config.scoring, baseRuns: numberOr(e.target.value, config.scoring.baseRuns) } })} /></label>
            <label>homeBonus<input type="number" step="0.01" value={config.scoring.homeBonus} onChange={(e) => setConfig({ ...config, scoring: { ...config.scoring, homeBonus: numberOr(e.target.value, config.scoring.homeBonus) } })} /></label>
            <label>awayPenalty<input type="number" step="0.01" value={config.scoring.awayPenalty} onChange={(e) => setConfig({ ...config, scoring: { ...config.scoring, awayPenalty: numberOr(e.target.value, config.scoring.awayPenalty) } })} /></label>
            <label>parkRunFactor<input type="number" step="0.01" value={config.scoring.parkRunFactor} onChange={(e) => setConfig({ ...config, scoring: { ...config.scoring, parkRunFactor: numberOr(e.target.value, config.scoring.parkRunFactor) } })} /></label>
            <label>pitcher weight<input type="number" step="0.01" value={config.weights.pitcher} onChange={(e) => setConfig({ ...config, weights: { ...config.weights, pitcher: numberOr(e.target.value, config.weights.pitcher) } })} /></label>
            <label>form weight<input type="number" step="0.01" value={config.weights.form} onChange={(e) => setConfig({ ...config, weights: { ...config.weights, form: numberOr(e.target.value, config.weights.form) } })} /></label>
            <label>batting weight<input type="number" step="0.01" value={config.weights.batting} onChange={(e) => setConfig({ ...config, weights: { ...config.weights, batting: numberOr(e.target.value, config.weights.batting) } })} /></label>
            <label>bullpen weight<input type="number" step="0.01" value={config.weights.bullpen} onChange={(e) => setConfig({ ...config, weights: { ...config.weights, bullpen: numberOr(e.target.value, config.weights.bullpen) } })} /></label>
            <label>lineup weight<input type="number" step="0.01" value={config.weights.lineup} onChange={(e) => setConfig({ ...config, weights: { ...config.weights, lineup: numberOr(e.target.value, config.weights.lineup) } })} /></label>
            <label>park weight<input type="number" step="0.01" value={config.weights.park} onChange={(e) => setConfig({ ...config, weights: { ...config.weights, park: numberOr(e.target.value, config.weights.park) } })} /></label>
          </div>
        </div>
      </section>

      <section className="grid two-col analysis-grid">
        <div className="card analysis-card">
          <div className="card-header">
            <h2>분석 결과</h2>
            <button onClick={saveCurrentAnalysis} disabled={!analysisBundle}>현재 분석 저장</button>
          </div>

          {!selectedGame || !analysisBundle ? <p className="empty">경기를 선택해 분석을 확인해라.</p> : (
            <div className="analysis-stack">
              <div className={recommendationClass(analysisBundle.recommendation.level)}>
                <div>
                  <span className="section-label">추천</span>
                  <strong>{analysisBundle.recommendation.headline}</strong>
                  <p>{analysisBundle.recommendation.description}</p>
                  <small>{analysisBundle.market.hasMarketOdds ? `시장 배당 반영 · ${analysisBundle.market.bookmakerTitle ?? 'bookmaker'}` : '시장 배당 미연결 · 기본 배당 사용'}</small>
                </div>
                <div className="match-mini">
                  <span>{gameLabel(selectedGame)}</span>
                  <small>{gameTime(selectedGame)}</small>
                </div>
              </div>

              <div className="metric-grid four-up">
                <div className="metric"><span>예상 홈 득점</span><strong>{analysisBundle.result.expectedHomeRuns}</strong></div>
                <div className="metric"><span>예상 원정 득점</span><strong>{analysisBundle.result.expectedAwayRuns}</strong></div>
                <div className="metric"><span>예상 점수차</span><strong>{analysisBundle.result.expectedMargin}</strong></div>
                <div className="metric"><span>예상 총점</span><strong>{analysisBundle.result.expectedTotal}</strong></div>
              </div>

              <div className="metric-grid" style={{ marginTop: 4 }}>
                <div className="metric"><span>BB 신뢰도</span><strong>{confidence.label}</strong></div>
                <div className="metric"><span>신뢰도 점수</span><strong>{formatBb(confidence.score)}</strong></div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <h3>추천 이유</h3>
                  <span>상위 BB 요소 자동 요약</span>
                </div>
                <div className="metric"><span>이유</span><strong>{reason}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="card analysis-side-card">
          <div className="card-header">
            <h2>범위 검증 / 원인 분석</h2>
          </div>

          <div className="ops-note">
            <h3>범위 추천 설정</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
              <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              <button onClick={runRangeAnalyzer} disabled={rangeLoading}>{rangeLoading ? '분석중' : '시작'}</button>
            </div>
            <ul className="plain-list">
              <li>{rangeStatus}</li>
              <li>범위 경기 수: {rangeSummary.totalGames}건</li>
              <li>범위 검증 수: {rangeSummary.verifiedCount}건</li>
              <li>범위 적중률: {(rangeSummary.winRate * 100).toFixed(1)}%</li>
              <li>고BB 미적중: {rangeSummary.highBbMisses}건</li>
            </ul>
          </div>

          <div className="ops-note" style={{ marginTop: 16 }}>
            <h3>고BB 미적중 원인 분류</h3>
            <div className="saved-list admin-saved-list" style={{ maxHeight: 220 }}>
              {rangeSummary.missReasons.length === 0 ? (
                <p className="empty">고BB 미적중 데이터가 아직 없다.</p>
              ) : rangeSummary.missReasons.map((item) => (
                <div key={item.key} className="saved-item">
                  <strong>{item.label}</strong>
                  <small>{item.count}건</small>
                </div>
              ))}
            </div>
          </div>

          <div className="ops-note" style={{ marginTop: 16 }}>
            <h3>고BB 미적중 경기 목록</h3>
            <div className="saved-list admin-saved-list" style={{ maxHeight: 260 }}>
              {rangeSummary.highBbMissGames.length === 0 ? (
                <p className="empty">고BB 미적중 경기 없음</p>
              ) : rangeSummary.highBbMissGames.map((game) => (
                <div key={game.id} className="saved-item">
                  <strong>{game.matchup}</strong>
                  <small>{game.date}</small>
                  <small>{game.marketType} · BB {formatBb(game.bbValue)}</small>
                  <small>원인: {game.reason}</small>
                  <small>가장 큰 요소: {game.topFactor}</small>
                </div>
              ))}
            </div>
          </div>



          <div className="ops-note" style={{ marginTop: 16 }}>
            <h3>시장별 성능</h3>
            <div className="saved-list admin-saved-list" style={{ maxHeight: 220 }}>
              {([
                ['moneyline', '머니라인'],
                ['spread', '핸디캡'],
                ['total', '언오버'],
              ] as const).map(([key, label]) => {
                const stat = rangeSummary.marketStats[key];
                return (
                  <div key={key} className="saved-item">
                    <strong>{label}</strong>
                    <small>검증 {stat.total}건</small>
                    <small>적중 {stat.wins}건 / 미적중 {stat.losses}건 / 적중무효 {stat.pushes}건</small>
                    <small>적중률 {(stat.rate * 100).toFixed(1)}%</small>
                    <small>고BB 미적중 {stat.highBbMisses}건</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ops-note" style={{ marginTop: 16 }}>
            <h3>BB 구간별 적중률</h3>
            <div className="saved-list admin-saved-list" style={{ maxHeight: 220 }}>
              {rangeSummary.bbBuckets.length === 0 ? (
                <p className="empty">범위 검증 결과가 있어야 구간 적중률이 계산된다.</p>
              ) : rangeSummary.bbBuckets.map((bucket) => (
                <div key={bucket.label} className="saved-item">
                  <strong>{bucket.label}</strong>
                  <small>검증 {bucket.total}건</small>
                  <small>적중 {bucket.wins}건 / 미적중 {bucket.losses}건 / 적중무효 {bucket.pushes}건</small>
                  <small>적중률 {(bucket.rate * 100).toFixed(1)}%</small>
                </div>
              ))}
            </div>
          </div>

          <div className="ops-note" style={{ marginTop: 16 }}>
            <h3>추천 설정값</h3>
            <div className="metric-grid">
              <div className="metric"><span>선발</span><strong>{formatBb(rangeRecommendedSettings.recommended.weights.pitcher)}</strong></div>
              <div className="metric"><span>최근 흐름</span><strong>{formatBb(rangeRecommendedSettings.recommended.weights.form)}</strong></div>
              <div className="metric"><span>타격</span><strong>{formatBb(rangeRecommendedSettings.recommended.weights.batting)}</strong></div>
              <div className="metric"><span>불펜</span><strong>{formatBb(rangeRecommendedSettings.recommended.weights.bullpen)}</strong></div>
              <div className="metric"><span>라인업</span><strong>{formatBb(rangeRecommendedSettings.recommended.weights.lineup)}</strong></div>
              <div className="metric"><span>구장</span><strong>{formatBb(rangeRecommendedSettings.recommended.weights.park)}</strong></div>
            </div>
          </div>

          <div className="ops-note" style={{ marginTop: 16 }}>
            <h3>자동 추적 요약</h3>
            <ul className="plain-list">
              <li>전체 기록: {trackingSummary.total}건 / 대기중: {trackingSummary.pending}건</li>
              <li>정산 완료: {trackingSummary.settled}건 / 승률: {(trackingSummary.winRate * 100).toFixed(1)}%</li>
              <li>머니라인: {trackingSummary.byMarket.moneyline.total}건 / 승률 {(trackingSummary.byMarket.moneyline.winRate * 100).toFixed(1)}%</li>
              <li>핸디캡: {trackingSummary.byMarket.spread.total}건 / 승률 {(trackingSummary.byMarket.spread.winRate * 100).toFixed(1)}%</li>
              <li>언오버: {trackingSummary.byMarket.total.total}건 / 승률 {(trackingSummary.byMarket.total.winRate * 100).toFixed(1)}%</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
