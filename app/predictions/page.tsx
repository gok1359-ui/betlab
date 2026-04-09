import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PredictionsPage() {
  const supabase = createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("predictions")
    .select("id, home_team, away_team, market_type, recommendation, bb_value, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="section-header">
          <div>
            <div className="text-sm font-black tracking-[0.16em] text-cyan-200/80">MY PREDICTIONS</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">내 예측</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 betlab-muted">
              저장된 추천 기록과 최근 예측 흐름을 확인하는 페이지.
            </p>
          </div>
          <span className="badge">{rows?.length ?? 0}건</span>
        </div>
      </section>

      {!rows || rows.length === 0 ? (
        <section className="card">
          <div className="section-header">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-white">아직 저장된 예측이 없다</h2>
              <p className="mt-3 text-base leading-7 betlab-muted">
                오늘 경기 분석을 보면서 추천 흐름을 먼저 확인하고, 추후 저장 기능과 연동하면 이곳에 기록이 쌓인다.
              </p>
            </div>
            <Link href="/games" className="button">경기 보러가기</Link>
          </div>
        </section>
      ) : (
        <section className="grid-2">
          {rows.map((row: any) => (
            <article key={row.id} className="card">
              <div className="section-header">
                <strong className="text-2xl font-black tracking-[-0.04em] text-white">
                  {row.away_team} vs {row.home_team}
                </strong>
                <span className="badge">{row.market_type || "market"}</span>
              </div>

              <p className="mt-4 text-xl font-black tracking-[-0.03em] text-white">
                {row.recommendation || "관찰"}
              </p>

              <p className="mt-3 text-[15px] font-bold text-sky-300">
                BB점수 {Number(row.bb_value ?? 0).toFixed(2)}
              </p>

              <div className="mt-5 text-sm font-semibold text-white/55">
                {String(row.created_at ?? "").slice(0, 16).replace("T", " ")}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
