export default function BbBreakdownCard() {
  const items = [
    ["선발", "0.18"],
    ["최근 흐름", "0.06"],
    ["타격", "0.09"],
    ["불펜", "0.11"],
    ["라인업", "0.04"],
    ["구장", "0.03"],
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-bold">BB Breakdown</h3>
      <div className="mt-4 grid-3">
        {items.map(([label, value]) => (
          <div key={label} className="card">
            <div className="text-sm opacity-70">{label}</div>
            <div className="mt-2 text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
