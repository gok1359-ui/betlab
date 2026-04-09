import { notFound } from "next/navigation";
import { getPublicGame } from "@/lib/db/queries";
import { toKorTeamName } from "@/lib/mlbTeamKor";
import { buildReadableReason } from "@/lib/readableReason";

function getBbTier(bbValue: number) {
  if (bbValue >= 0.35) return { label: "S급", color: "#facc15" };
  if (bbValue >= 0.22) return { label: "A급", color: "#38bdf8" };
  if (bbValue >= 0.12) return { label: "B급", color: "#818cf8" };
  return { label: "관찰", color: "#94a3b8" };
}

function n(v: unknown, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function marketLabel(marketType?: string) {
  if (marketType === "spread") return "핸디캡";
  if (marketType === "total") return "언오버";
  return "머니라인";
}

function totalLean(total: number) {
  if (total >= 9.0) return "오버 성향";
  if (total <= 7.5) return "언더 성향";
  return "중립";
}

function marginLean(margin: number) {
  if (margin >= 1.5) return "홈 우세";
  if (margin <= -1.5) return "원정 우세";
  return "접전 예상";
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await getPublicGame(gameId);

  if (!game) notFound();

  const home = toKorTeamName(game.homeTeam);
  const away = toKorTeamName(game.awayTeam);
  const bb = n(game.bbValue);
  const tier = getBbTier(bb);
  const expectedHome = n((game as any).expectedHomeRuns);
  const expectedAway = n((game as any).expectedAwayRuns);
  const expectedMargin = n((game as any).expectedMargin, expectedHome - expectedAway);
  const expectedTotal = n((game as any).expectedTotal, expectedHome + expectedAway);
  const readable = buildReadableReason(String(game.reason || ""), String(game.recommendation || ""), (game as any).marketType);

  return (
    <main className="space-y-5">
      <section className="card">
        <div className="section-header">
          <div>
            <div className="text-sm font-black tracking-[0.16em] text-cyan-200/80">GAME DETAIL</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
              {away} vs {home}
            </h1>
            <p className="mt-3 text-base leading-7 betlab-muted">
              {game.gameTime || game.gameDate}
            </p>
          </div>
          <span className="badge">{tier.label}</span>
        </div>

        <div className="grid-2 mt-5">
          <div className="card-soft">
            <div className="text-sm font-bold text-white/60">추천</div>
            <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
              {game.recommendation || "관찰"}
            </div>
            <div className="mt-2 text-sm font-semibold text-white/60">
              시장: {marketLabel((game as any).marketType)}
            </div>
          </div>

          <div
            className="card-soft"
            style={{
              borderColor: `${tier.color}33`,
              boxShadow: `0 0 0 1px ${tier.color}14 inset`,
            }}
          >
            <div className="text-sm font-bold text-white/60">BB점수</div>
            <div
              className="mt-2 text-3xl font-black tracking-[-0.05em]"
              style={{ color: tier.color }}
            >
              {bb.toFixed(2)}
            </div>
            <div className="mt-2 text-sm font-semibold text-white/60">
              추천 강도: {tier.label}
            </div>
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="text-xl font-black tracking-[-0.04em] text-white">예상 스코어</div>
          <div className="mt-4 card-soft">
            <div className="text-sm font-bold text-white/55">Projected Score</div>
            <div className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
              {away} {expectedAway.toFixed(1)} : {expectedHome.toFixed(1)} {home}
            </div>
            <div className="mt-3 text-sm font-semibold text-white/65">
              점수차 {expectedMargin.toFixed(1)} · {marginLean(expectedMargin)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-xl font-black tracking-[-0.04em] text-white">언오버 관점</div>
          <div className="mt-4 card-soft">
            <div className="text-sm font-bold text-white/55">Projected Total</div>
            <div className="mt-3 text-4xl font-black tracking-[-0.05em] text-sky-300">
              {expectedTotal.toFixed(1)}
            </div>
            <div className="mt-3 text-sm font-semibold text-white/65">
              총점 성향: {totalLean(expectedTotal)}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="text-xl font-black tracking-[-0.04em] text-white">선발 투수</div>
        <div className="mt-4 card-soft">
          <div className="text-base font-bold text-white">
            {game.awayPitcher || "미정"} vs {game.homePitcher || "미정"}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="text-xl font-black tracking-[-0.04em] text-white">AI 핵심 한줄</div>
        <div className="mt-4 card-soft">
          <div className="text-lg font-black tracking-[-0.03em] text-white">
            {readable.summary}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="text-xl font-black tracking-[-0.04em] text-white">AI 추천 해설</div>
        <div className="mt-4 card-soft">
          <div className="text-[15px] leading-7 text-white/85">
            {readable.detail}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="text-xl font-black tracking-[-0.04em] text-white">원본 분석 근거</div>
        <div className="mt-4 card-soft">
          <div className="text-[15px] leading-7 text-white/80">
            {game.reason || "분석 데이터 없음"}
          </div>
        </div>
      </section>
    </main>
  );
}
