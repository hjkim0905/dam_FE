export type Entry = {
  id: number;
  date: string;
  color: string;
  imageUrl: string;
  memo: string;
  /** 서버의 사용자 id. 내 것인지 가리려면 내 id 와 견줘야 한다. */
  author: string;
  authorName: string;
};

export type Company = 'mine' | 'both' | 'theirs';

/** 화면의 필터 이름을 서버가 아는 이름으로 옮긴다. */
export function viewOf(company: Company): 'MINE' | 'BOTH' | 'THEIRS' {
  return company === 'mine' ? 'MINE' : company === 'both' ? 'BOTH' : 'THEIRS';
}

/** 그 달 전체를 덮는 구간. 서버는 from 과 to 를 반드시 받는다. */
export function monthRange(monthKey: string): { from: string; to: string } {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${monthKey}-01`, to: `${monthKey}-${String(lastDay).padStart(2, '0')}` };
}

export function yearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

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

/** 저장된 순서를 믿지 않는다. 화면은 왼쪽에서 오른쪽으로 시간이 흐른다고 읽는다. */
export function entriesInMonth(
  entries: readonly Entry[],
  monthKey: string
): Entry[] {
  return entries
    .filter((e) => monthKeyOf(e.date) === monthKey)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function monthLabel(dateKey: string): string {
  return `${Number(monthKeyOf(dateKey).slice(5))}월`;
}

export function monthTitle(dateKey: string): string {
  const [year, month] = monthKeyOf(dateKey).split('-');
  return `${year}년 ${Number(month)}월`;
}

/** 하루를 양쪽에서 본 것. 둘 다 담았으면 달력 한 칸이 반으로 갈린다. */
export function sidesOn(
  entries: readonly Entry[],
  dateKey: string,
  me: string
): Sides {
  const day = entries.filter((e) => e.date === dateKey);
  return {
    mine: day.find((e) => e.author === me) ?? null,
    theirs: day.find((e) => e.author !== me) ?? null,
  };
}

/**
 * 휠이 고를 수 있는 해들. 기록을 구간으로 나눠 받게 되면서 화면에는 한 달이나
 * 한 해치만 있다. 가장 이른 해는 서버가 알려주는 처음 담은 날에서 얻는다.
 */
export function yearsSince(firstKeptDate: string | null, shown: number): number[] {
  const earliest = firstKeptDate === null
    ? shown
    : Math.min(Number(firstKeptDate.slice(0, 4)), shown);

  return Array.from({ length: shown - earliest + 1 }, (_, i) => earliest + i);
}

/**
 * 한 해를 한 줄로 잇는 값. 왼쪽이 1월이다. 색이 하나면 그라데이션이 성립하지 않고,
 * 아직 담은 것이 없으면 빈 자리로 남는다.
 */
export function bandOf(colors: readonly string[]): string {
  if (colors.length === 0) return 'var(--color-faint)';
  if (colors.length === 1) return colors[0];

  return `linear-gradient(to right, ${colors.join(', ')})`;
}
