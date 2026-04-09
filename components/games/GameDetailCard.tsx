import { toKorTeamName } from "@/lib/mlbTeamKor";

type GameDetailCardProps = {
  game: {
    id: string;
    gamePk: number;
    gameDate: string;
    homeTeam: string;
    awayTeam: string;
    recommendation: string;
    bbValue: number;
    reason: string;
    homePitcher?: string;
    awayPitcher?: string;
    gameTime?: string;
    expectedHomeRuns?: number;
    expectedAwayRuns?: number;
    expectedMargin?: number;
    expectedTotal?: number;
    marketType?: string;
  };
};

function getBbLabel(bbValue: number) {
  if (bbValue >= 0.22) return "강신뢰";
  if (bbValue >= 0.12) return "중신뢰";
  return "관찰";
}

function safeNum(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function marketLabel(marketType?: string) {
  if (marketType === "spread") return "핸디캡";
  if (marketType === "total") return "언오버";
  return "머니라인";
}

export default function GameDetailCard({ game }: GameDetailCardProps) {
  const homeName = toKorTeamName(game.homeTeam);
  const awayName = toKorTeamName(game.awayTeam);
  const bbValue = safeNum(game.bbValue);
  const expectedHomeRuns = safeNum(game.expectedHomeRuns, 0);
  const expectedAwayRuns = safeNum(game.expectedAwayRuns, 0);
  const expectedMargin = safeNum(game.expectedMargin, 0);
  const expectedTotal = safeNum(game.expectedTotal, 0);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-bold">{awayName} vs {homeName}</div>
            <div className="mt-1 text-sm opacity-70">{game.gameTime || game.gameDate}</div>
          </div>
          <span className="badge">{getBbLabel(bbValue)}</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70">추천</div>
            <div className="mt-1 text-lg font-semibold">{game.recommendation || "관찰"}</div>
            <div className="mt-2 text-sm opacity-80">시장: {marketLabel(game.marketType)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70">선발투수</div>
            <div className="mt-1 font-medium">
              {game.awayPitcher || "미정"} vs {game.homePitcher || "미정"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card">
          <div className="text-sm opacity-70">예상 홈 득점</div>
          <div className="mt-2 text-2xl font-bold">{expectedHomeRuns.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">예상 원정 득점</div>
          <div className="mt-2 text-2xl font-bold">{expectedAwayRuns.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">예상 점수차</div>
          <div className="mt-2 text-2xl font-bold">{expectedMargin.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">예상 총점</div>
          <div className="mt-2 text-2xl font-bold">{expectedTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="text-sm opacity-70">BB점수</div>
          <div className="mt-2 text-2xl font-bold">{bbValue.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-sm opacity-70">추천 사유</div>
          <div className="mt-2 text-sm leading-6 opacity-90">{game.reason || "분석 사유 없음"}</div>
        </div>
      </div>
    </div>
  );
}
