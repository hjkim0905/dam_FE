import assert from 'node:assert/strict';
import test from 'node:test';
import { ratioOf } from './upload';

test('진행률은 0 에서 1 사이다', () => {
  assert.equal(ratioOf({ loaded: 0, total: 100 }), 0);
  assert.equal(ratioOf({ loaded: 50, total: 100 }), 0.5);
  assert.equal(ratioOf({ loaded: 100, total: 100 }), 1);
});

test('총량을 모르면 진행률을 말하지 않는다', () => {
  // 서버가 Content-Length 를 안 주면 lengthComputable 이 거짓이다.
  // 이때 0 을 돌려주면 화면이 0% 에 멈춘 것처럼 보인다.
  assert.equal(ratioOf({ loaded: 40, total: 0 }), null);
});

test('보고된 값이 총량을 넘어도 1 을 넘지 않는다', () => {
  assert.equal(ratioOf({ loaded: 120, total: 100 }), 1);
});
