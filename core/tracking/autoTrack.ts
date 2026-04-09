
export type PredictionResult = "win" | "lose" | "push" | "pending";

export type PredictionRecord = {
  id: string;
  gamePk: number;
  date: string;
  createdAt: string;
  pick: string;
  marketType?: "moneyline" | "spread" | "total";
  bb: number;
  result: PredictionResult;
};

const STORAGE_KEY = "betlab:auto-tracking-records";

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRecords(): PredictionRecord[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records: PredictionRecord[]) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function savePrediction(input: Omit<PredictionRecord, "id" | "createdAt" | "result">) {
  const records = readRecords();

  const record: PredictionRecord = {
    id: `${input.gamePk}-${input.date}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    result: "pending",
    ...input,
  };

  records.unshift(record);
  writeRecords(records.slice(0, 1000));
  return record;
}

export function updateResult(gamePk: number, result: Exclude<PredictionResult, "pending">, date?: string) {
  const records = readRecords();
  const next = records.map((record) => {
    const sameGame = record.gamePk === gamePk;
    const sameDate = date ? record.date === date : true;
    return sameGame && sameDate ? { ...record, result } : record;
  });
  writeRecords(next);
  return next;
}

export function deletePrediction(id: string) {
  const records = readRecords().filter((record) => record.id !== id);
  writeRecords(records);
  return records;
}

export function clearPredictions(date?: string) {
  const records = date
    ? readRecords().filter((record) => record.date !== date)
    : [];
  writeRecords(records);
  return records;
}

export function getRecords() {
  return readRecords();
}

export function getRecordsByDate(date: string) {
  return readRecords().filter((record) => record.date === date);
}

export function getTrackingSummary(date?: string) {
  const records = date ? getRecordsByDate(date) : getRecords();

  const total = records.length;
  const pending = records.filter((r) => r.result === "pending").length;
  const wins = records.filter((r) => r.result === "win").length;
  const losses = records.filter((r) => r.result === "lose").length;
  const pushes = records.filter((r) => r.result === "push").length;

  const settled = wins + losses + pushes;
  const winRate = settled > 0 ? wins / settled : 0;

  const byMarket = {
    moneyline: summarizeByMarket(records, "moneyline"),
    spread: summarizeByMarket(records, "spread"),
    total: summarizeByMarket(records, "total"),
  };

  return {
    total,
    pending,
    wins,
    losses,
    pushes,
    settled,
    winRate,
    byMarket,
  };
}

function summarizeByMarket(
  records: PredictionRecord[],
  marketType: "moneyline" | "spread" | "total"
) {
  const items = records.filter((r) => r.marketType === marketType);
  const wins = items.filter((r) => r.result === "win").length;
  const losses = items.filter((r) => r.result === "lose").length;
  const pushes = items.filter((r) => r.result === "push").length;
  const settled = wins + losses + pushes;

  return {
    total: items.length,
    wins,
    losses,
    pushes,
    settled,
    winRate: settled > 0 ? wins / settled : 0,
  };
}
