/**
 * 키가 곧 캐시 주소다. 같아야 할 때 달라지면 같은 달을 두 번 받고,
 * 달라야 할 때 같으면 다른 달의 기록이 보인다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { ENTRIES, entriesKey } from './query-keys';

const SEPTEMBER = { from: '2026-09-01', to: '2026-09-30' };
const AUGUST = { from: '2026-08-01', to: '2026-08-31' };

test('같은 기간과 시점이면 같은 키가 나온다', () => {
  assert.deepEqual(entriesKey(SEPTEMBER, 'MINE'), entriesKey(SEPTEMBER, 'MINE'));
});

test('기간이 다르면 키가 갈린다', () => {
  assert.notDeepEqual(entriesKey(SEPTEMBER, 'MINE'), entriesKey(AUGUST, 'MINE'));
});

test('시점이 다르면 키가 갈린다', () => {
  assert.notDeepEqual(entriesKey(SEPTEMBER, 'MINE'), entriesKey(SEPTEMBER, 'BOTH'));
});

test('끝나는 날이 다르면 키가 갈린다', () => {
  // 달의 마지막 날은 28, 29, 30, 31 로 다르다. 시작만 보면 2월이 어긋난다.
  const short = { from: '2026-02-01', to: '2026-02-28' };
  const leap = { from: '2026-02-01', to: '2026-02-29' };

  assert.notDeepEqual(entriesKey(short, 'MINE'), entriesKey(leap, 'MINE'));
});

test('모든 키가 ENTRIES 로 시작해 한꺼번에 무효화된다', () => {
  const keys = [entriesKey(SEPTEMBER, 'MINE'), entriesKey(AUGUST, 'THEIRS')];

  for (const key of keys) assert.deepEqual(key.slice(0, ENTRIES.length), ENTRIES);
});
