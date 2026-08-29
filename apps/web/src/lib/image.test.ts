/**
 * 사진을 화면에 얹는 배치 계산. 문지른 좌표와 캔버스 픽셀이 어긋나면
 * 엉뚱한 색이 나오므로 object-fit: cover 와 같은 결과를 내야 한다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { coverRect, fitSize } from './image';

test('coverRect 는 가로가 넓은 사진의 좌우를 잘라낸다', () => {
  assert.deepEqual(coverRect({ width: 200, height: 100 }, { width: 100, height: 100 }), {
    x: -50, y: 0, width: 200, height: 100,
  });
});

test('coverRect 는 세로가 긴 사진의 위아래를 잘라낸다', () => {
  assert.deepEqual(coverRect({ width: 100, height: 200 }, { width: 100, height: 100 }), {
    x: 0, y: -50, width: 100, height: 200,
  });
});

test('coverRect 는 비율이 같으면 그대로 채운다', () => {
  assert.deepEqual(coverRect({ width: 400, height: 400 }, { width: 100, height: 100 }), {
    x: 0, y: 0, width: 100, height: 100,
  });
});

test('fitSize 는 긴 변을 한도에 맞춰 비율대로 줄인다', () => {
  assert.deepEqual(fitSize({ width: 4000, height: 3000 }, 800), { width: 800, height: 600 });
  assert.deepEqual(fitSize({ width: 3000, height: 4000 }, 800), { width: 600, height: 800 });
});

test('fitSize 는 한도보다 작은 사진을 키우지 않는다', () => {
  assert.deepEqual(fitSize({ width: 300, height: 200 }, 800), { width: 300, height: 200 });
});
