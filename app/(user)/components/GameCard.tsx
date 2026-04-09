"use client";

export default function GameCard({ game }: any) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 border border-white/10 hover:border-blue-400/40 transition-all">

      {/* header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">
          {game.homeKor} vs {game.awayKor}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
          {game.recommend || "관찰"}
        </span>
      </div>

      {/* pitcher */}
      <div className="text-sm text-gray-300 mb-3">
        {game.homePitcher} vs {game.awayPitcher}
      </div>

      {/* BB */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400">BB 점수</div>
          <div className="text-xl font-bold text-blue-400">
            {game.bb?.toFixed(2) || "0.00"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">추천</div>
          <div className="text-sm text-white">
            {game.market || "-"}
          </div>
        </div>
      </div>

    </div>
  );
}