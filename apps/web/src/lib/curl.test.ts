/**
 * 종이를 원통에 감듯 구부리는 계산. 페이지 넘김과 스티커 떼기가 같은 함수를 쓰므로
 * 여기가 틀리면 두 애니메이션이 같이 찢어지거나 늘어난다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { bend, clampToTurn, hugSpine, stackUnder, constrainToSpine, curlAt, foldFromDrag, turnProgress, type Fold, type Point } from './curl';

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

test('clampToTurn 은 가장자리 바깥과 거울 자리 너머로 손가락을 내보내지 않는다', () => {
  const grab = { x: 1, y: 0.5 };
  assert.deepEqual(clampToTurn(grab, { x: 1.02, y: 0.5 }), { x: 1, y: 0.5 });
  assert.deepEqual(clampToTurn(grab, { x: -1.03, y: 0.4 }), { x: -1, y: 0.4 });
  assert.deepEqual(clampToTurn(grab, { x: 0.2, y: 0.7 }), { x: 0.2, y: 0.7 });
});

test('foldFromDrag 는 조금 끌면 가장자리만 들고 뒷면은 아직 보이지 않는다', () => {
  const grab = { x: 10, y: 3 };
  const fold = foldFromDrag(grab, { x: 9.9, y: 3 }, 0.5);
  assert.ok(fold);
  const [edgeX, , edgeZ] = bend(grab.x, grab.y, fold);
  const [insideX] = bend(grab.x - 0.01, grab.y, fold);
  near([edgeX], [9.9]);
  assert.ok(edgeZ > 0, '가장자리가 들려야 한다');
  assert.ok(insideX < edgeX, '바로 안쪽 점이 가장자리보다 바깥에 놓이면 종이가 뒤집혀 뒷면이 보인 것이다');
});

test('foldFromDrag 는 원통 반 바퀴를 넘겨 끌어도 이어진다', () => {
  const grab = { x: 10, y: 3 };
  const radius = 0.5;
  const just = foldFromDrag(grab, { x: 10 - Math.PI * radius * 0.999, y: 3 }, radius);
  const over = foldFromDrag(grab, { x: 10 - Math.PI * radius * 1.001, y: 3 }, radius);
  assert.ok(just && over);
  assert.ok(Math.abs(just.x - over.x) < 0.01);
});

test('stackUnder 는 종이가 지금 놓인 쪽 더미의 높이를 준다', () => {
  /* 넘어간 부분이라도 아직 오른쪽 위에 걸쳐 있으면 오른쪽 더미 위에 있어야 한다. 왼쪽 높이로
     내리면 오른쪽 더미 속으로 가라앉아 아래 장의 사진이 그 위로 비친다. */
  assert.equal(stackUnder(0.3, 0.05, 0.01), 0.05);
  assert.equal(stackUnder(-0.3, 0.05, 0.01), 0.01);
  const middle = stackUnder(0, 0.05, 0.01);
  assert.ok(middle > 0.01 && middle < 0.05, `${middle}`);
});

test('hugSpine 은 반을 넘긴 장의 접힌 선을 책등으로 당긴다', () => {
  const fold: Fold = { x: 0.3, y: 0.7, angle: 0, radius: 0.1 };
  assert.deepEqual(hugSpine(fold, 0.2), fold);
  assert.equal(hugSpine(fold, 1).x, 0);
  /* 책등에 원통이 남으면 그 위쪽 면이 앞면이라 사진이 띠로 비친다. 다 붙으면 말린 곳도 없다. */
  assert.equal(hugSpine(fold, 1).radius, 0);
  const half = hugSpine(fold, 0.6).x;
  assert.ok(half > 0 && half < 0.3, `${half}`);
});
