import GameCard from "@/components/games/GameCard";
import { getPublicGames } from "@/lib/db/queries";

export default async function GamesPage() {
  const games = await getPublicGames();

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section className="card">
        <div className="section-header">
          <div>
            <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900, letterSpacing: "-0.05em", color: "#fff" }}>경기 목록</h1>
            <p style={{ marginTop: 10, marginBottom: 0, color: "rgba(255,255,255,0.72)" }}>전 경기 카드형 추천 화면</p>
          </div>
          <span className="badge">{games.length}경기</span>
        </div>
      </section>

      {games.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>표시할 경기 데이터가 아직 없다.</p>
        </div>
      ) : (
        <div className="grid-2">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
