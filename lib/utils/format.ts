export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatBb(value: number) {
  return value.toFixed(2);
}

export function formatDate(value: string) {
  return value;
}
