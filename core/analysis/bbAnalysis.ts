
import { getRecords } from '../tracking/autoTrack';

export function getBBBuckets() {
  const records = getRecords();

  const buckets = [
    { min: 0, max: 0.5 },
    { min: 0.5, max: 1.0 },
    { min: 1.0, max: 1.5 },
    { min: 1.5, max: 2.0 },
    { min: 2.0, max: Infinity },
  ];

  return buckets.map((b) => {
    const items = records.filter(r => {
      const bb = Math.abs(r.bb);
      return bb >= b.min && bb < b.max;
    });

    const wins = items.filter(r => r.result === 'win').length;
    const losses = items.filter(r => r.result === 'lose').length;
    const pushes = items.filter(r => r.result === 'push').length;
    const settled = wins + losses + pushes;

    return {
      range: `${b.min} ~ ${b.max === Infinity ? '+' : b.max}`,
      total: items.length,
      settled,
      wins,
      losses,
      pushes,
      winRate: settled ? wins / settled : 0
    };
  });
}
