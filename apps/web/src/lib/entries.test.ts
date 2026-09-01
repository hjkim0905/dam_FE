/**
 * 색 기록의 날짜 규칙. 하루에 여러 기록이 올 수 있으므로(나중에 둘이 함께 채운다)
 * 조회는 항상 배열을 돌려준다. 혼자 쓸 때는 길이가 1 이다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  entriesInMonth,
  entriesOn,
  entriesFrom,
  hasCompany,
  monthDayLabel,
  monthLabel,
  monthTitle,
  sidesOn,
  monthKeyOf,
  toDateKey,
  upsertEntry,
} from './entries';
import type { Entry } from './entries';

function entry(date: string, color = '#123456', author = 'me'): Entry {
  return { date, color, imageUrl: '', memo: '', author };
}

test('toDateKey 는 UTC 가 아니라 그 자리의 날짜를 쓴다', () => {
  assert.equal(toDateKey(new Date(2026, 7, 18, 0, 30)), '2026-08-18');
  assert.equal(toDateKey(new Date(2026, 0, 1, 23, 59)), '2026-01-01');
});

test('monthKeyOf 는 날짜에서 달만 남긴다', () => {
  assert.equal(monthKeyOf('2026-08-18'), '2026-08');
});

test('entriesOn 은 그날의 기록을 배열로 준다', () => {
  const all = [entry('2026-08-17'), entry('2026-08-18', '#aaa000')];

  assert.deepEqual(
    entriesOn(all, '2026-08-18').map((e) => e.color),
    ['#aaa000']
  );
});

test('entriesOn 은 기록이 없으면 빈 배열을 준다', () => {
  assert.deepEqual(entriesOn([entry('2026-08-17')], '2026-08-18'), []);
});

test('upsertEntry 는 같은 날 기록을 덮어쓴다', () => {
  const before = [entry('2026-08-17', '#aaaaaa'), entry('2026-08-18', '#bbbbbb')];

  const after = upsertEntry(before, entry('2026-08-18', '#cccccc'));

  assert.equal(after.length, 2);
  assert.equal(entriesOn(after, '2026-08-18')[0].color, '#cccccc');
});

test('upsertEntry 는 원본을 건드리지 않는다', () => {
  const before = [entry('2026-08-18', '#bbbbbb')];

  upsertEntry(before, entry('2026-08-18', '#cccccc'));

  assert.equal(before[0].color, '#bbbbbb');
});

test('upsertEntry 는 날짜 오름차순을 지킨다', () => {
  const after = upsertEntry([entry('2026-08-18')], entry('2026-08-02'));

  assert.deepEqual(after.map((e) => e.date), ['2026-08-02', '2026-08-18']);
});

test('entriesInMonth 는 그 달의 기록만 고른다', () => {
  const all = [entry('2026-07-31'), entry('2026-08-01'), entry('2026-09-01')];

  assert.deepEqual(
    entriesInMonth(all, '2026-08').map((e) => e.date),
    ['2026-08-01']
  );
});

test('monthDayLabel 은 앞의 0 을 떼고 읽는 말로 준다', () => {
  assert.equal(monthDayLabel('2026-08-01'), '8월 1일');
  assert.equal(monthDayLabel('2026-12-25'), '12월 25일');
});

test('monthLabel 은 앞의 0 을 떼고 읽는 말로 준다', () => {
  assert.equal(monthLabel('2026-08-01'), '8월');
  assert.equal(monthLabel('2026-12-25'), '12월');
});

test('monthTitle 은 년과 월을 함께 준다', () => {
  assert.equal(monthTitle('2026-09-01'), '2026년 9월');
});

test('entriesFrom 은 보기에 따라 작성자를 가른다', () => {
  const all = [entry('2026-09-01', '#a', 'me'), entry('2026-09-02', '#b', 'you')];

  assert.deepEqual(entriesFrom(all, 'mine').map((e) => e.color), ['#a']);
  assert.deepEqual(entriesFrom(all, 'theirs').map((e) => e.color), ['#b']);
  assert.deepEqual(entriesFrom(all, 'both').map((e) => e.color), ['#a', '#b']);
});

test('hasCompany 는 혼자 쓰는 동안 거짓이다', () => {
  assert.equal(hasCompany([entry('2026-09-01')]), false);
  assert.equal(hasCompany([entry('2026-09-01'), entry('2026-09-01', '#b', 'you')]), true);
});

test('sidesOn 은 같은 날의 양쪽을 갈라 준다', () => {
  const all = [entry('2026-09-05', '#a', 'me'), entry('2026-09-05', '#b', 'you')];
  const both = sidesOn(all, '2026-09-05');

  assert.equal(both.mine?.color, '#a');
  assert.equal(both.theirs?.color, '#b');
});

test('sidesOn 은 한쪽만 담은 날에 나머지를 비운다', () => {
  const only = sidesOn([entry('2026-09-05', '#a', 'me')], '2026-09-05');

  assert.equal(only.mine?.color, '#a');
  assert.equal(only.theirs, null);
});

test('entriesInMonth 는 저장된 순서와 무관하게 날짜순으로 준다', () => {
  const jumbled = [entry('2026-09-22'), entry('2026-09-03'), entry('2026-09-14')];

  assert.deepEqual(
    entriesInMonth(jumbled, '2026-09').map((e) => e.date),
    ['2026-09-03', '2026-09-14', '2026-09-22']
  );
});
