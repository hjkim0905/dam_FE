/**
 * 색 기록의 날짜 규칙. 하루에 여러 기록이 올 수 있으므로(나중에 둘이 함께 채운다)
 * 조회는 항상 배열을 돌려준다. 혼자 쓸 때는 길이가 1 이다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bandOf,
  entriesInMonth,
  monthDayLabel,
  monthLabel,
  monthRange,
  monthTitle,
  sidesOn,
  monthKeyOf,
  toDateKey,
  viewOf,
  yearRange,
  yearsSince,
} from './entries';
import type { Entry } from './entries';

let nextId = 1;

function entry(date: string, color = '#123456', author = '1'): Entry {
  return {
    id: nextId++,
    date,
    color,
    imageUrl: '',
    memo: '',
    author,
    authorName: author === '1' ? '지호' : '민서',
  };
}

test('toDateKey 는 UTC 가 아니라 그 자리의 날짜를 쓴다', () => {
  assert.equal(toDateKey(new Date(2026, 7, 18, 0, 30)), '2026-08-18');
  assert.equal(toDateKey(new Date(2026, 0, 1, 23, 59)), '2026-01-01');
});

test('monthKeyOf 는 날짜에서 달만 남긴다', () => {
  assert.equal(monthKeyOf('2026-08-18'), '2026-08');
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

test('sidesOn 은 같은 날의 양쪽을 갈라 준다', () => {
  const all = [entry('2026-09-05', '#a', '1'), entry('2026-09-05', '#b', '2')];
  const both = sidesOn(all, '2026-09-05', '1');

  assert.equal(both.mine?.color, '#a');
  assert.equal(both.theirs?.color, '#b');
});

test('sidesOn 은 한쪽만 담은 날에 나머지를 비운다', () => {
  const only = sidesOn([entry('2026-09-05', '#a', '1')], '2026-09-05', '1');

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

test('yearsSince 는 처음 담은 해부터 보고 있는 해까지 준다', () => {
  assert.deepEqual(yearsSince('2024-05-01', 2026), [2024, 2025, 2026]);
});

test('yearsSince 는 담은 것이 없으면 보고 있는 해 하나만 준다', () => {
  assert.deepEqual(yearsSince(null, 2026), [2026]);
});

test('yearsSince 는 처음 담은 해보다 앞선 해를 보고 있어도 그 해를 뺀다', () => {
  // 휠을 과거로 돌려둔 채 들어오면 shown 이 더 이를 수 있다.
  assert.deepEqual(yearsSince('2026-09-01', 2024), [2024]);
});

test('bandOf 는 색이 여럿일 때만 그라데이션이 된다', () => {
  assert.equal(bandOf(['#aaa', '#bbb']), 'linear-gradient(to right, #aaa, #bbb)');
  assert.equal(bandOf(['#aaa']), '#aaa');
  assert.equal(bandOf([]), 'var(--color-faint)');
});

test('viewOf 는 화면의 필터 이름을 서버 이름으로 옮긴다', () => {
  assert.equal(viewOf('mine'), 'MINE');
  assert.equal(viewOf('both'), 'BOTH');
  assert.equal(viewOf('theirs'), 'THEIRS');
});

test('monthRange 는 그 달의 첫날과 마지막날을 준다', () => {
  assert.deepEqual(monthRange('2026-09'), { from: '2026-09-01', to: '2026-09-30' });
  assert.deepEqual(monthRange('2026-01'), { from: '2026-01-01', to: '2026-01-31' });
});

test('monthRange 는 윤년 2월을 안다', () => {
  // 28 로 굳혀 두면 4년에 한 번 마지막 날이 조회에서 빠진다.
  assert.deepEqual(monthRange('2028-02'), { from: '2028-02-01', to: '2028-02-29' });
  assert.deepEqual(monthRange('2026-02'), { from: '2026-02-01', to: '2026-02-28' });
});

test('yearRange 는 한 해를 덮는다', () => {
  assert.deepEqual(yearRange(2026), { from: '2026-01-01', to: '2026-12-31' });
});
