import Link from "next/link";
import { toKorTeamName } from "@/lib/mlbTeamKor";

type GameCardProps = {
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
  };
};

function getBbTier(bbValue: number) {
  if (bbValue >= 0.35) {
    return {
      label: "S급",
      tone: "#facc15",
      bg: "linear-gradient(135deg, rgba(250,204,21,0.18), rgba(251,191,36,0.10))",
      border: "rgba(250,204,21,0.30)",
      glow: "0 0 0 1px rgba(250,204,21,0.08), 0 10px 22px rgba(250,204,21,0.14)",
    };
  }

  if (bbValue >= 0.22) {
    return {
      label: "A급",
      tone: "#7dd3fc",
      bg: "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(96,165,250,0.10))",
      border: "rgba(125,211,252,0.28)",
      glow: "0 0 0 1px rgba(125,211,252,0.08), 0 10px 22px rgba(56,189,248,0.12)",
    };
  }

  if (bbValue >= 0.12) {
    return {
      label: "B급",
      tone: "#c4b5fd",
      bg: "linear-gradient(135deg, rgba(129,140,248,0.16), rgba(167,139,250,0.10))",
      border: "rgba(196,181,253,0.24)",
      glow: "0 0 0 1px rgba(196,181,253,0.08), 0 10px 22px rgba(129,140,248,0.10)",
    };
  }

  return {
    label: "관찰",
    tone: "#94a3b8",
    bg: "linear-gradient(135deg, rgba(148,163,184,0.10), rgba(100,116,139,0.08))",
    border: "rgba(148,163,184,0.18)",
    glow: "none",
  };
}

function getBbLabel(bbValue: number) {
  if (bbValue >= 0.22) return "강신뢰";
  if (bbValue >= 0.12) return "중신뢰";
  return "관찰";
}

function getBbWidth(bbValue: number) {
  const value = Math.max(10, Math.min(100, Math.round(bbValue * 220)));
  return `${value}%`;
}

export default function GameCard({ game }: GameCardProps) {
  const homeName = toKorTeamName(game.homeTeam);
  const awayName = toKorTeamName(game.awayTeam);
  const bbValue = Number(game.bbValue ?? 0);
  const bbLabel = getBbLabel(bbValue);
  const bbTier = getBbTier(bbValue);

  return (
    <Link
      href={`/games/${game.id}`}
      style={{
        display: "block",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "linear-gradient(180deg, rgba(18,31,68,0.96), rgba(9,20,50,0.98))",
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.04em", color: "#fff" }}>
            {awayName} vs {homeName}
          </div>
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.68)" }}>
            {game.gameTime || game.gameDate}
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: "1px solid rgba(96,165,250,0.25)",
            background: "rgba(96,165,250,0.12)",
            color: "#dbeafe",
            fontSize: 12,
            fontWeight: 800,
            padding: "6px 10px",
            whiteSpace: "nowrap",
          }}
        >
          {bbLabel}
        </span>
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          padding: 14,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>선발투수</div>
        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.5 }}>
          {game.awayPitcher || "미정"} vs {game.homePitcher || "미정"}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 200px", gap: 12 }}>
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            padding: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>추천 시장</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff" }}>
            {game.recommendation || "관찰"}
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${bbTier.border}`,
            background: bbTier.bg,
            boxShadow: bbTier.glow,
            padding: 14,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>BB점수</div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                padding: "4px 8px",
                fontSize: 11,
                fontWeight: 900,
                color: bbTier.tone,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {bbTier.label}
            </span>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: bbTier.tone,
            }}
          >
            {bbValue.toFixed(2)}
          </div>

          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.62)" }}>
            추천 강도 시각 강조
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.62)" }}>
          <span>신뢰도 바</span>
          <span style={{ color: bbTier.tone }}>{bbTier.label} · {bbLabel}</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
          <div
            style={{
              width: getBbWidth(bbValue),
              height: "100%",
              borderRadius: 999,
              background:
                bbValue >= 0.35
                  ? "linear-gradient(90deg, #facc15, #f59e0b)"
                  : bbValue >= 0.22
                  ? "linear-gradient(90deg, #38bdf8, #818cf8)"
                  : bbValue >= 0.12
                  ? "linear-gradient(90deg, #818cf8, #a78bfa)"
                  : "linear-gradient(90deg, #64748b, #94a3b8)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          padding: 14,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>추천 사유</div>
        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: "rgba(255,255,255,0.92)" }}>
          {game.reason || "분석 사유 없음"}
        </div>
      </div>
    </Link>
  );
}
