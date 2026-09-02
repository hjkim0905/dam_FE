/**
 * 어느 방울이 가운데 왔는지. 이 값이 바뀌는 순간에만 햅틱을 울리므로
 * 경계에서 값이 튀면 진동이 두 번 울린다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { snappedIndex, stripSlots } from './carousel';

test('snappedIndex는 가장 가까운 칸을 고른다', () => {
  assert.equal(snappedIndex(0, 100, 5), 0);
  assert.equal(snappedIndex(49, 100, 5), 0);
  assert.equal(snappedIndex(50, 100, 5), 1);
  assert.equal(snappedIndex(230, 100, 5), 2);
});

test('snappedIndex는 범위를 넘지 않는다', () => {
  assert.equal(snappedIndex(-80, 100, 5), 0);
  assert.equal(snappedIndex(9999, 100, 5), 4);
});

test('snappedIndex는 칸이 없거나 간격이 0이면 0을 준다', () => {
  assert.equal(snappedIndex(120, 0, 5), 0);
  assert.equal(snappedIndex(120, 100, 0), 0);
});

test('stripSlots 는 오늘을 담았으면 그 자리를 가리키고 빈 자리를 두지 않는다', () => {
  const dates = ['2026-09-01', '2026-09-02', '2026-09-03'];

  assert.deepEqual(stripSlots(dates, '2026-09-02'), { slots: 3, todayIndex: 1 });
});

test('stripSlots 는 안 담은 날에 끝의 빈 자리를 오늘로 준다', () => {
  const dates = ['2026-09-01', '2026-09-03'];

  assert.deepEqual(stripSlots(dates, '2026-09-05'), { slots: 3, todayIndex: 2 });
});

test('stripSlots 는 오늘이 마지막이 아니어도 그 자리를 찾는다', () => {
  const dates = ['2026-09-02', '2026-09-05', '2026-09-26'];

  assert.deepEqual(stripSlots(dates, '2026-09-02'), { slots: 3, todayIndex: 0 });
});

test('stripSlots 는 기록이 없으면 빈 자리 하나만 둔다', () => {
  assert.deepEqual(stripSlots([], '2026-09-02'), { slots: 1, todayIndex: 0 });
});

test('stripSlots 는 지난 달엔 빈 자리를 붙이지 않는다', () => {
  const dates = ['2026-08-02', '2026-08-19'];

  assert.deepEqual(stripSlots(dates, null), { slots: 2, todayIndex: 1 });
});

test('stripSlots 는 기록 없는 지난 달에도 흔들리지 않는다', () => {
  assert.deepEqual(stripSlots([], null), { slots: 0, todayIndex: 0 });
});
