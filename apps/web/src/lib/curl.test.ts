/**
 * 종이를 원통에 감듯 구부리는 계산. 페이지 넘김과 스티커 떼기가 같은 함수를 쓰므로
 * 여기가 틀리면 두 애니메이션이 같이 찢어지거나 늘어난다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { bend, constrainToSpine, curlAt, foldFromDrag, turnProgress, type Fold, type Point } from './curl';

const near = (actual: readonly number[], expected: readonly number[], epsilon = 1e-9) => {
  actual.forEach((value, i) => {
    assert.ok(Math.abs(value - expected[i]) < epsilon, `[${actual}] ≠ [${expected}]`);
  });
};

const upright: Fold = { x: 5, y: 0, angle: 0, radius: 1 };

test('bend 는 접힘선 안쪽의 점을 그대로 둔다', () => {
  near(bend(1, 2, upright), [1, 2, 0]);
  near(bend(5, 2, upright), [5, 2, 0]);
});

test('bend 는 원통의 4분의 1 지점을 반지름만큼 들어 올린다', () => {
  near(bend(5 + Math.PI / 2, 2, upright), [6, 2, 1]);
});

test('bend 는 원통을 반 바퀴 돈 점을 접힘선 바로 위에 둔다', () => {
  near(bend(5 + Math.PI, 2, upright), [5, 2, 2]);
});

test('bend 는 원통을 넘어선 부분을 뒤집어 평평하게 눕힌다', () => {
  near(bend(5 + Math.PI + 3, 2, upright), [2, 2, 2]);
});

test('bend 는 반지름이 0 이면 접힘선을 기준으로 뒤집는다', () => {
  near(bend(8, 2, { ...upright, radius: 0 }), [2, 2, 0]);
});

test('bend 는 기울어진 접힘선에서도 종이 길이를 지킨다', () => {
  const tilted: Fold = { x: 0, y: 0, angle: Math.PI / 4, radius: 1 };
  const step = Math.PI / Math.SQRT2;
  near(bend(step, step, tilted), [0, 0, 2]);
});

test('foldFromDrag 는 끌지 않았으면 접지 않는다', () => {
  assert.equal(foldFromDrag({ x: 3, y: 3 }, { x: 3, y: 3 }, 0.5), null);
});

test('foldFromDrag 는 잡은 점을 손가락 바로 위로 옮긴다', () => {
  const grab: Point = { x: 9, y: 2 };
  [{ x: 2, y: 5 }, { x: 8.5, y: 2 }, { x: 4, y: -1 }].forEach((finger) => {
    const fold = foldFromDrag(grab, finger, 0.5);
    assert.ok(fold);
    const [x, y] = bend(grab.x, grab.y, fold);
    near([x, y], [finger.x, finger.y]);
  });
});

test('foldFromDrag 는 잡은 쪽만 들고 반대쪽은 붙여 둔다', () => {
  const fold = foldFromDrag({ x: 10, y: 0 }, { x: 6, y: 0 }, 0.5);
  assert.ok(fold);
  near(bend(0, 0, fold), [0, 0, 0]);
  assert.ok(bend(10, 0, fold)[2] > 0);
});

test('foldFromDrag 는 모서리를 잡으면 대각선으로 접는다', () => {
  const fold = foldFromDrag({ x: 10, y: 14 }, { x: 7, y: 11 }, 0.5);
  assert.ok(fold);
  near([Math.cos(fold.angle), Math.sin(fold.angle)], [Math.SQRT1_2, Math.SQRT1_2]);
});

test('constrainToSpine 은 책등에서 잡은 점보다 멀리 끌지 못하게 한다', () => {
  const page = { width: 10, height: 14 };
  const grab = { x: 10, y: 7 };
  const finger = constrainToSpine(grab, { x: 30, y: 7 }, page);
  near([finger.x, finger.y], [10, 7], 1e-9);
});

test('constrainToSpine 은 한쪽 모서리만 넘으면 그 원 위로 끌어당긴다', () => {
  const page = { width: 10, height: 14 };
  const grab = { x: 10, y: 0 };
  const finger = constrainToSpine(grab, { x: 20, y: 0 }, page);
  near([finger.x, finger.y], [10, 0], 1e-9);
  const lifted = constrainToSpine(grab, { x: 6, y: 6 }, page);
  near([lifted.x, lifted.y], [6, 6]);
});

test('constrainToSpine 은 닿을 수 있는 곳의 손가락은 그대로 둔다', () => {
  const page = { width: 10, height: 14 };
  const finger = constrainToSpine({ x: 10, y: 7 }, { x: 3, y: 6 }, page);
  near([finger.x, finger.y], [3, 6]);
});

test('turnProgress 는 잡은 점이 책등 건너편 거울 자리에 가면 1 이다', () => {
  assert.equal(turnProgress({ x: 8, y: 3 }, { x: 8, y: 3 }), 0);
  assert.equal(turnProgress({ x: 8, y: 3 }, { x: 0, y: 3 }), 0.5);
  assert.equal(turnProgress({ x: 8, y: 3 }, { x: -8, y: 3 }), 1);
  assert.equal(turnProgress({ x: 8, y: 3 }, { x: -20, y: 3 }), 1);
});

test('curlAt 은 잡은 점을 원통에서 주어진 각도만큼만 들어 올린다', () => {
  const fold = curlAt({ x: 4, y: 2 }, { x: 1, y: 0 }, 0.5, Math.PI / 2);
  near(bend(4, 2, fold), [4 - 0.5 * (Math.PI / 2) + 0.5, 2, 0.5]);
});

test('curlAt 은 잡은 반대쪽을 붙여 둔다', () => {
  const fold = curlAt({ x: 4, y: 4 }, { x: Math.SQRT1_2, y: Math.SQRT1_2 }, 0.5, 1.2);
  near(bend(0, 0, fold), [0, 0, 0]);
  assert.ok(bend(4, 4, fold)[2] > 0);
});

test('curlAt 은 각도가 0 이면 아무것도 들지 않는다', () => {
  const fold = curlAt({ x: 4, y: 2 }, { x: 1, y: 0 }, 0.5, 0);
  near(bend(4, 2, fold), [4, 2, 0]);
});
