import { TEAM_KOR } from "@/lib/mlbTeamKor";

type GameCardData = {
  homeTeam: string;
  awayTeam: string;
  homePitcher?: string;
  awayPitcher?: string;
  recommendation?: string;
  bb?: number;
};

type GameCardProps = {
  game: GameCardData;
};

export default function GameCard({ game }: GameCardProps) {
  const homeName = TEAM_KOR[game.homeTeam] || game.homeTeam;
  const awayName = TEAM_KOR[game.awayTeam] || game.awayTeam;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 border border-white/10 hover:border-blue-400/40 transition-all">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">
          {homeName} vs {awayName}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
          {game.recommendation || "관찰"}
        </span>
      </div>

      <div className="text-sm text-gray-300 mb-3">
        {(game.homePitcher || "미정")} vs {(game.awayPitcher || "미정")}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400">BB 점수</div>
          <div className="text-xl font-bold text-blue-400">
            {Number(game.bb ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">추천</div>
          <div className="text-sm text-white">
            {game.recommendation || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
