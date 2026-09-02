/**
 * 달을 요일 격자에 앉히는 계산. 앞 빈칸이 하나만 어긋나도 모든 날짜가 요일을 잘못 탄다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { monthCells } from './calendar';

test('monthCells 는 1일의 요일만큼 앞을 비운다', () => {
  // 2026-09-01 은 화요일이라 일·월 두 칸이 빈다.
  const cells = monthCells('2026-09');

  assert.deepEqual(cells.slice(0, 3), [null, null, '2026-09-01']);
});

test('monthCells 는 그 달의 날수를 모두 담는다', () => {
  assert.equal(monthCells('2026-09').filter(Boolean).length, 30);
  assert.equal(monthCells('2026-08').filter(Boolean).length, 31);
  assert.equal(monthCells('2026-02').filter(Boolean).length, 28);
  assert.equal(monthCells('2024-02').filter(Boolean).length, 29);
});

test('monthCells 는 일요일에 시작하는 달을 비우지 않는다', () => {
  assert.equal(monthCells('2026-02')[0], '2026-02-01');
});

test('monthCells 는 여섯 주를 넘지 않는다', () => {
  // 토요일에 시작하는 31일 달이 가장 길다.
  assert.ok(monthCells('2026-08').length <= 42);
});
