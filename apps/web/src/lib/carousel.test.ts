/**
 * 어느 방울이 가운데 왔는지. 이 값이 바뀌는 순간에만 햅틱을 울리므로
 * 경계에서 값이 튀면 진동이 두 번 울린다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { snappedIndex } from './carousel';

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
