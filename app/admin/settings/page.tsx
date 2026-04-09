"use client";

import { useState } from "react";
import MarketWeightSettings from "@/components/admin/MarketWeightSettings";
import RecommendedWeightsCard from "@/components/admin/RecommendedWeightsCard";

type MarketWeights = {
  moneyline: { homeAdv: number; pitcher: number; batting: number; bullpen: number; recent: number };
  spread: { homeAdv: number; pitcher: number; batting: number; bullpen: number; recent: number };
  total: { homeAdv: number; pitcher: number; batting: number; bullpen: number; recent: number };
};

export default function SettingsPage() {
  const [weights, setWeights] = useState<MarketWeights>({
    moneyline: { homeAdv: 0.05, pitcher: 0.4, batting: 0.2, bullpen: 0.25, recent: 0.1 },
    spread: { homeAdv: 0.03, pitcher: 0.25, batting: 0.35, bullpen: 0.2, recent: 0.17 },
    total: { homeAdv: 0.01, pitcher: 0.2, batting: 0.45, bullpen: 0.1, recent: 0.24 },
  });

  function handleChange(
    market: keyof MarketWeights,
    key: keyof MarketWeights["moneyline"],
    value: number
  ) {
    setWeights((prev) => ({
      ...prev,
      [market]: {
        ...prev[market],
        [key]: Number.isFinite(value) ? value : 0,
      },
    }));
  }

  return (
    <main className="space-y-4">
      <RecommendedWeightsCard />
      <MarketWeightSettings settings={weights} onChange={handleChange} />
    </main>
  );
}
