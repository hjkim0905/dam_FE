import { call } from './client';
import type { EntriesResponse, KeptResponse } from './types';
import type { Entry } from '../entries';

/** 내것, 함께, 상대것. 무엇을 보여줄지는 서버가 정한다. */
export type View = 'MINE' | 'BOTH' | 'THEIRS';

export type DateRange = { from: string; to: string };

export function toEntry(kept: KeptResponse): Entry {
  return {
    id: kept.id,
    date: kept.date,
    color: kept.color,
    imageUrl: kept.photoUrl,
    memo: kept.memo ?? '',
    author: String(kept.author.id),
    authorName: kept.author.name,
  };
}

export async function fetchEntries(range: DateRange, view: View): Promise<Entry[]> {
  const { entries } = await call<EntriesResponse>('get', 'entries', {
    searchParams: { from: range.from, to: range.to, view },
  });
  return entries.map(toEntry);
}

export async function keepEntry(input: {
  date: string;
  color: string;
  photoKey: string;
  memo?: string;
}): Promise<Entry> {
  return toEntry(await call<KeptResponse>('post', 'entries', { json: input }));
}
