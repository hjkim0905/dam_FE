'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchEntries } from '@/lib/api/entries';
import type { DateRange, View } from '@/lib/api/entries';
import { entriesKey } from '@/lib/query-keys';

/* 내 기록을 바꾸는 것은 나뿐이고, 담는 순간 캐시를 버린다(record/page.tsx).
   그래서 오래 들고 있어도 낡을 길이 없다. */
const MINE_STALE_MS = 5 * 60 * 1000;

/* 상대가 언제 담을지는 알 길이 없다. 탭에 들어올 때 무효화가 걸리므로 탭을 드나들면
   최신이지만, 한 화면에 머무는 동안은 이만큼 낡은 것을 볼 수 있다. */
const SHARED_STALE_MS = 30 * 1000;

export default function useEntries(range: DateRange, view: View) {
  const { data, isError } = useQuery({
    queryKey: entriesKey(range, view),
    queryFn: () => fetchEntries(range, view),
    staleTime: view === 'MINE' ? MINE_STALE_MS : SHARED_STALE_MS,
  });

  /* 아직 모른다(null)와 비었다([])를 가른다. 세 화면이 첫 페인트에서 이 둘을
     다르게 그리므로, 기본값을 여기 한 번만 두어 화면마다 어긋날 일을 없앤다. */
  return { entries: data ?? null, failed: isError };
}
