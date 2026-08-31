export type Entry = {
  date: string;
  color: string;
  imageUrl: string;
  memo: string;
};

export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** 화면 낭독용. '2026-08-18' 을 그대로 읽으면 알아들을 수 없다. */
export function monthDayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

export function entriesOn(
  entries: readonly Entry[],
  dateKey: string
): Entry[] {
  return entries.filter((e) => e.date === dateKey);
}

export function entriesInMonth(
  entries: readonly Entry[],
  monthKey: string
): Entry[] {
  return entries.filter((e) => monthKeyOf(e.date) === monthKey);
}

export function upsertEntry(entries: readonly Entry[], entry: Entry): Entry[] {
  const others = entries.filter((e) => e.date !== entry.date);
  return [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
}
