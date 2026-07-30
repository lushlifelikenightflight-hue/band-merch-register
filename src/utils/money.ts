export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function parseYen(value: string): number | null {
  if (!/^\d*$/.test(value)) return null;
  if (value === "") return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
