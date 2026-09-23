import type { DateRange, View } from './api/entries';

/** 어느 달이 캐시에 있든 한꺼번에 무효화할 때 쓴다. */
export const ENTRIES = ['entries'] as const;

/**
 * 기간과 시점이 곧 캐시 주소다. range 를 객체째로 넣어도 동작은 같지만,
 * 납작하게 펴 두어야 devtools 에서 어느 달이 캐시에 있는지 바로 읽힌다.
 */
export function entriesKey(range: DateRange, view: View) {
  return [...ENTRIES, range.from, range.to, view] as const;
}
