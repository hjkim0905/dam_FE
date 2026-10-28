/**
 * 손을 뗀 페이지와 스티커가 제자리를 찾아가는 속도. 프레임이 밀려도 같은 시간에
 * 같은 곳에 있어야, 느린 기기에서 애니메이션이 늘어지지 않는다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { approach } from './motion';

test('approach 는 시간이 지나지 않으면 제자리에 있다', () => {
  assert.equal(approach(0.2, 1, 0, 9), 0.2);
});

test('approach 는 목표를 지나치지 않는다', () => {
  assert.ok(approach(0, 1, 10, 9) <= 1);
  assert.ok(approach(1, 0, 10, 9) >= 0);
});

test('approach 는 프레임을 나눠도 한 번에 간 것과 같은 곳에 닿는다', () => {
  const once = approach(0, 1, 0.1, 9);
  const twice = approach(approach(0, 1, 0.05, 9), 1, 0.05, 9);
  assert.ok(Math.abs(once - twice) < 1e-12);
});
