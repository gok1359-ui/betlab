import Link from "next/link";
import GameCard from "@/components/games/GameCard";
import { getPublicGames } from "@/lib/db/queries";
import { getHomeRankingsPreview } from "@/lib/db/userRetention";

export default async function HomePage() {
  const games = await getPublicGames();
  const topGames = games.slice(0, 4);
  const highConfidenceGames = games.filter((game) => Number(game.bbValue ?? 0) >= 0.22).slice(0, 6);
  const rankings = await getHomeRankingsPreview();

  return (
    <main className="space-y-6">
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="highlight-chip">SPORTS ANALYSIS PLATFORM</div>
            <h1 className="hero-title" style={{ marginTop: 18, marginBottom: 0 }}>
              BetLab에서 보는 오늘 추천 경기
            </h1>
            <p className="hero-subtitle">
              전 경기 분석, 추천 강도와 BB점수, 커뮤니티와 실시간 소통까지 한 화면에서 이어지는 BetLab 메인 홈.
            </p>

            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="badge">추천 강도 기준</span>
              <span className="badge">BB점수 기반</span>
              <span className="badge">실시간 의견 반영</span>
            </div>
          </div>

          {topGames.length > 0 ? (
            <section className="space-y-4">
              <div className="section-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em" }}>오늘 추천 TOP</h2>
                  <p className="betlab-muted" style={{ marginTop: 8, marginBottom: 0 }}>오늘 기준 BB점수가 높은 경기들만 먼저 모아봤다.</p>
                </div>
                <Link href="/games" className="button-secondary">전체 경기 보기</Link>
              </div>

              <div className="grid-2">
                {topGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          ) : null}

          {highConfidenceGames.length > 0 ? (
            <section className="space-y-4">
              <div className="section-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em" }}>강추천만 보기</h2>
                  <p className="betlab-muted" style={{ marginTop: 8, marginBottom: 0 }}>BB점수 0.22 이상 경기만 따로 모아본 섹션.</p>
                </div>
                <span className="badge">{highConfidenceGames.length}경기</span>
              </div>

              <div className="grid-2">
                {highConfidenceGames.map((game) => (
                  <GameCard key={`high-${game.id}`} game={game} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="section-header">
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em" }}>계정</h2>
              <span className="badge">빠른 접근</span>
            </div>

            <div className="card-soft" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.60)" }}>로그인 / 회원가입</div>
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.82)" }}>
                로그인하면 커뮤니티 글 작성, 실시간 채팅 참여, 내 예측 기록 확인이 가능하다.
              </p>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Link href="/login" className="button" style={{ minWidth: 110 }}>로그인</Link>
                <Link href="/signup" className="button-secondary" style={{ minWidth: 110 }}>회원가입</Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em" }}>실시간 채팅</h2>
              <span className="badge">커뮤니티 연동</span>
            </div>

            <div className="card-soft" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fde68a" }}>BetLab 채팅방</div>
              <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.82)" }}>
                로그인 후 실시간 채팅과 경기 의견 공유 가능
              </p>

              <div className="betlab-divider" style={{ marginTop: 14, paddingTop: 14, fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,0.72)" }}>
                • 오늘 강추천 경기 의견 교환<br />
                • BB점수, 분석 이유 토론<br />
                • 커뮤니티와 함께 실시간 소통
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Link href="/community" className="button" style={{ minWidth: 120 }}>커뮤니티 이동</Link>
                <Link href="/login" className="button-secondary" style={{ minWidth: 120 }}>채팅 참여</Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em" }}>랭킹 미리보기</h2>
              <Link href="/rankings" className="badge">전체 보기</Link>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {rankings.length === 0 ? (
                <div className="card-soft">
                  <p className="betlab-muted" style={{ margin: 0 }}>랭킹 데이터가 아직 없다.</p>
                </div>
              ) : (
                rankings.map((row, index) => (
                  <div key={row.id} className="card-soft" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)" }}>TOP {index + 1}</div>
                      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900 }}>{row.nickname}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.55)" }}>포인트</div>
                      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900, color: "#7dd3fc" }}>{row.points}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em" }}>오늘 경기 분석</h2>
            <p className="betlab-muted" style={{ marginTop: 8, marginBottom: 0 }}>카드형 분석 화면으로 오늘 경기를 편하게 확인할 수 있다.</p>
          </div>
          <span className="badge">{games.length}경기</span>
        </div>

        {games.length === 0 ? (
          <div className="card">
            <p className="betlab-muted">표시할 경기 데이터가 아직 없다.</p>
          </div>
        ) : (
          <div className="grid-2">
            {games.slice(0, 8).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
