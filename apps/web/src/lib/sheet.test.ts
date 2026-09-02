/**
 * 시트를 놓았을 때의 판정. 손이 가던 속도를 무시하면 짧고 빠른 손짓이 먹지 않아
 * 화면이 손가락을 놓친 것처럼 느껴진다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { rubberBand, settleDuration, shouldDismiss } from './sheet';

test('shouldDismiss 는 충분히 끌어내렸으면 닫는다', () => {
  assert.equal(shouldDismiss(300, 0, 600), true);
  assert.equal(shouldDismiss(100, 0, 600), false);
});

test('shouldDismiss 는 조금 끌었어도 아래로 튕기면 닫는다', () => {
  assert.equal(shouldDismiss(40, 1.2, 600), true);
});

test('shouldDismiss 는 많이 끌었어도 위로 튕기면 되돌린다', () => {
  assert.equal(shouldDismiss(400, -1.2, 600), false);
});

test('settleDuration 은 빠를수록 짧게 마무리한다', () => {
  const fast = settleDuration(200, 2);
  const slow = settleDuration(200, 0.6);

  assert.ok(fast < slow, `${fast} < ${slow}`);
});

test('settleDuration 은 멈춘 손에도 끝나는 시간을 준다', () => {
  assert.equal(settleDuration(200, 0), 420);
});

test('settleDuration 은 아무리 빨라도 한 순간에 끝내지 않는다', () => {
  assert.equal(settleDuration(10, 999), 120);
});

test('rubberBand 는 아래로는 그대로, 위로는 저항을 준다', () => {
  assert.equal(rubberBand(120), 120);
  assert.ok(rubberBand(-100) > -100, '위로 끈 만큼 다 올라가면 안 된다');
  assert.ok(rubberBand(-100) < 0);
});
