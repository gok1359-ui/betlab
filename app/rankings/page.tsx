import { getRankings } from "@/lib/db/userRetention";

export default async function RankingsPage() {
  const rows = await getRankings(30);

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="section-header">
          <div>
            <div className="text-sm font-black tracking-[0.16em] text-cyan-200/80">POINT RANKING</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">랭킹</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 betlab-muted">
              유저 포인트 기준 상위 랭킹. 운영 구조에 따라 포인트 적립/정산이 반영된다.
            </p>
          </div>
          <span className="badge">{rows.length}명</span>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="card">
          <p className="betlab-muted">표시할 랭킹 데이터가 아직 없다.</p>
        </section>
      ) : (
        <section className="space-y-4">
          {rows.map((row, index) => (
            <article key={row.id} className="card">
              <div className="section-header">
                <div>
                  <div className="text-sm font-black tracking-[0.12em] text-white/55">RANK {index + 1}</div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{row.nickname}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="text-sm font-bold text-white/55">포인트</div>
                  <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-sky-300">{row.points}</div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
