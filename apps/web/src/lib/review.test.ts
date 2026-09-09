/**
 * 별점을 물을 자리는 담기를 마친 직후뿐이다. 다만 첫날에 물으면 판단할 것이
 * 없다. 쌓여야 이 앱이 무엇인지 알게 된다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldAskForReview } from './review';

test('처음 몇 번은 묻지 않는다', () => {
  for (const kept of [1, 2]) {
    assert.equal(shouldAskForReview(kept), false, `${kept}번째`);
  }
});

test('쌓인 것이 보이기 시작할 때 묻는다', () => {
  assert.equal(shouldAskForReview(3), true);
});

test('그 뒤로는 뜸하게 묻는다', () => {
  assert.equal(shouldAskForReview(10), true);
  assert.equal(shouldAskForReview(30), true);
});

test('사이에 있는 날에는 묻지 않는다', () => {
  for (const kept of [4, 5, 9, 11, 29, 31, 100]) {
    assert.equal(shouldAskForReview(kept), false, `${kept}번째`);
  }
});

test('셈이 잘못 와도 묻지 않는다', () => {
  // keptCount 를 못 읽었다고 아무 때나 창을 띄우면 안 된다.
  for (const kept of [0, -1, NaN]) {
    assert.equal(shouldAskForReview(kept), false, `${kept}`);
  }
});
