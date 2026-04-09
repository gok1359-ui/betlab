import { TEAM_KOR } from "@/lib/mlbTeamKor";

export default function GameCard({ game }) {
  const homeName = TEAM_KOR[game.homeTeam] || game.homeTeam;
  const awayName = TEAM_KOR[game.awayTeam] || game.awayTeam;

  return (
    <div className="card">
      <div className="text-lg font-bold">
        {awayName} vs {homeName}
      </div>

      <div className="text-sm opacity-70 mt-1">
        선발: {game.awayPitcher || "미정"} vs {game.homePitcher || "미정"}
      </div>

      <div className="text-sm opacity-60">
        {game.gameTime}
      </div>

      <div className="mt-2">
        {game.recommendation}
      </div>

      <div className="text-sm">
        BB: {game.bb?.toFixed?.(2) ?? "-"}
      </div>
    </div>
  );
}
