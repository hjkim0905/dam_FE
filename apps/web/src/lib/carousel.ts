export function snappedIndex(
  scrollLeft: number,
  itemPitch: number,
  count: number
): number {
  if (itemPitch <= 0 || count <= 0) return 0;

  const raw = Math.round(scrollLeft / itemPitch);
  return Math.max(0, Math.min(raw, count - 1));
}

export type Strip = { slots: number; todayIndex: number };

/**
 * 홈 띠의 자리 배치. 오늘을 아직 담지 않았으면 끝에 빈 자리가 하나 더 붙는다.
 * 오늘이 늘 마지막인 것은 아니므로 자리를 세지 않고 찾는다 — 저장된 순서가
 * 날짜순이 아니면 엉뚱한 칸이 가운데 온다.
 */
export function stripSlots(dates: readonly string[], today: string): Strip {
  const kept = dates.indexOf(today);
  if (kept === -1) return { slots: dates.length + 1, todayIndex: dates.length };

  return { slots: dates.length, todayIndex: kept };
}
