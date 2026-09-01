/** 방이 생기기 전까지의 작성자. 백엔드가 붙으면 실제 사용자 id 로 바뀐다. */
export const ME = 'me';

export type Entry = {
  date: string;
  color: string;
  imageUrl: string;
  memo: string;
  author: string;
};

export type Company = 'mine' | 'both' | 'theirs';

export type Sides = { mine: Entry | null; theirs: Entry | null };

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

/** 저장된 순서를 믿지 않는다. 화면은 왼쪽에서 오른쪽으로 시간이 흐른다고 읽는다. */
export function entriesInMonth(
  entries: readonly Entry[],
  monthKey: string
): Entry[] {
  return entries
    .filter((e) => monthKeyOf(e.date) === monthKey)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 하루에 한 사람당 하나다. 날짜만 보고 지우면 같은 날 상대가 담은 것까지 사라진다. */
export function upsertEntry(entries: readonly Entry[], entry: Entry): Entry[] {
  const others = entries.filter(
    (e) => e.date !== entry.date || e.author !== entry.author
  );
  return [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
}

export function monthLabel(dateKey: string): string {
  return `${Number(monthKeyOf(dateKey).slice(5))}월`;
}

export function monthTitle(dateKey: string): string {
  const [year, month] = monthKeyOf(dateKey).split('-');
  return `${year}년 ${Number(month)}월`;
}

export function entriesFrom(
  entries: readonly Entry[],
  view: Company,
  me: string = ME
): Entry[] {
  if (view === 'both') return [...entries];
  const wantsMine = view === 'mine';
  return entries.filter((e) => (e.author === me) === wantsMine);
}

/** 필터를 보여줄지 정한다. 고를 것이 하나뿐인 필터는 화면에 소음만 더한다. */
export function hasCompany(entries: readonly Entry[], me: string = ME): boolean {
  return entries.some((e) => e.author !== me);
}

/** 하루를 양쪽에서 본 것. 둘 다 담았으면 달력 한 칸이 반으로 갈린다. */
export function sidesOn(
  entries: readonly Entry[],
  dateKey: string,
  me: string = ME
): Sides {
  const day = entriesOn(entries, dateKey);
  return {
    mine: day.find((e) => e.author === me) ?? null,
    theirs: day.find((e) => e.author !== me) ?? null,
  };
}
