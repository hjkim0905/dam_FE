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
 *
 * 지난 달을 보고 있으면 today 가 null 이다. 그 달엔 담을 자리가 없으므로 빈 자리를
 * 붙이지 않고, 가장 나중 기록을 가운데 둔다.
 */
export function stripSlots(dates: readonly string[], today: string | null): Strip {
  if (today === null) {
    return { slots: dates.length, todayIndex: Math.max(0, dates.length - 1) };
  }

  const kept = dates.indexOf(today);
  if (kept === -1) return { slots: dates.length + 1, todayIndex: dates.length };

  return { slots: dates.length, todayIndex: kept };
}
