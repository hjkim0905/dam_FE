/**
 * 사진에서 오늘의 색을 뽑는 계산. 캔버스 픽셀 배열만 받는 순수 함수다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { averageColor, pixelAt, rgbToHex } from './color';

const rgba = (...pixels: number[][]) => Uint8ClampedArray.from(pixels.flat());

test('rgbToHex 는 두 자리로 채운 소문자 hex 를 만든다', () => {
  assert.equal(rgbToHex({ r: 0, g: 0, b: 0 }), '#000000');
  assert.equal(rgbToHex({ r: 255, g: 128, b: 5 }), '#ff8005');
});

test('averageColor 는 불투명 픽셀의 평균을 낸다', () => {
  assert.deepEqual(averageColor(rgba([100, 50, 0, 255], [200, 150, 100, 255])), {
    r: 150, g: 100, b: 50,
  });
});

test('averageColor 는 흰색·검은색에 가까운 픽셀을 빼고 계산한다', () => {
  const data = rgba([250, 250, 250, 255], [5, 5, 5, 255], [120, 60, 30, 255]);

  assert.deepEqual(averageColor(data), { r: 120, g: 60, b: 30 });
});

test('averageColor 는 반투명 픽셀을 빼고 계산한다', () => {
  assert.deepEqual(averageColor(rgba([0, 0, 255, 10], [120, 60, 30, 255])), {
    r: 120, g: 60, b: 30,
  });
});

test('averageColor 는 쓸 픽셀이 없으면 null 을 준다', () => {
  assert.equal(averageColor(rgba([255, 255, 255, 255])), null);
  assert.equal(averageColor(new Uint8ClampedArray()), null);
});

test('pixelAt 은 좌표의 색을 준다', () => {
  const data = rgba(
    [10, 20, 30, 255], [40, 50, 60, 255],
    [70, 80, 90, 255], [100, 110, 120, 255]
  );

  assert.deepEqual(pixelAt(data, 2, 1, 1), { r: 100, g: 110, b: 120 });
});

test('pixelAt 은 캔버스 밖 좌표를 경계로 당긴다', () => {
  const data = rgba([10, 20, 30, 255], [40, 50, 60, 255]);

  assert.deepEqual(pixelAt(data, 2, -5, 0), { r: 10, g: 20, b: 30 });
  assert.deepEqual(pixelAt(data, 2, 99, 0), { r: 40, g: 50, b: 60 });
});

test('pixelAt 은 아무것도 안 그려진 자리를 null 로 알린다', () => {
  const blank = new Uint8ClampedArray(2 * 2 * 4);

  assert.equal(pixelAt(blank, 2, 0, 0), null);
});
