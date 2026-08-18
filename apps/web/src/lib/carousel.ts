export function snappedIndex(
  scrollLeft: number,
  itemPitch: number,
  count: number
): number {
  if (itemPitch <= 0 || count <= 0) return 0;

  const raw = Math.round(scrollLeft / itemPitch);
  return Math.max(0, Math.min(raw, count - 1));
}
