export function timeUntil(dateStr: string): string {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs <= 0) return 'soon';
  const hours = Math.round(diffMs / 3_600_000);
  return hours <= 1 ? '1 hour' : `${hours} hours`;
}
