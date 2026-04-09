"use client";

type WeightRow = {
  homeAdv: number;
  pitcher: number;
  batting: number;
  bullpen: number;
  recent: number;
};

type Props = {
  settings: {
    moneyline: WeightRow;
    spread: WeightRow;
    total: WeightRow;
  };
  onChange: (
    market: "moneyline" | "spread" | "total",
    key: keyof WeightRow,
    value: number
  ) => void;
};

const LABELS: Record<keyof WeightRow, string> = {
  homeAdv: "홈 어드밴티지",
  pitcher: "선발",
  batting: "타격",
  bullpen: "불펜",
  recent: "최근 폼",
};

export default function MarketWeightSettings({ settings, onChange }: Props) {
  return (
    <div className="card">
      <div className="section-header">
        <h2>시장별 영향도 설정</h2>
        <span>1차 UI</span>
      </div>

      {(["moneyline", "spread", "total"] as const).map((market) => (
        <div key={market} className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <strong>{market.toUpperCase()}</strong>
          <div className="grid-3 mt-3">
            {(Object.keys(LABELS) as Array<keyof WeightRow>).map((key) => (
              <label key={key} className="space-y-2">
                <span className="text-sm opacity-80">{LABELS[key]}</span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={settings[market][key]}
                  onChange={(e) => onChange(market, key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
