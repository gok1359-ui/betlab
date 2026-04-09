export type CacheEntry<T> = {
  savedAt: number;
  expiresAt: number;
  value: T;
};

function storageAvailable() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function readCache<T>(key: string): T | null {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.expiresAt !== 'number' || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T, ttlMs: number) {
  if (!storageAvailable()) return;
  try {
    const entry: CacheEntry<T> = {
      savedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      value,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export function removeCache(key: string) {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function buildDailyCacheKey(prefix: string, date: string) {
  return `betlab:${prefix}:${date}`;
}

export const CACHE_TTL = {
  schedule: 1000 * 60 * 60 * 24 * 30,
  oddsRecent: 1000 * 60 * 10,
  oddsHistorical: 1000 * 60 * 60 * 24 * 30,
  resultsRecent: 1000 * 60 * 15,
  resultsHistorical: 1000 * 60 * 60 * 24 * 30,
};
