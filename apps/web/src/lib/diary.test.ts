/**
 * 다꾸 페이지 위에서 붙인 것을 다루는 계산. 화면은 서버 답을 기다리지 않고 먼저 움직이므로
 * 여기서 자른 범위가 서버와 다르면 손을 뗀 순간 스티커가 튄다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendPage,
  cutoutFrame,
  cutoutPoint,
  pivotTransform,
  pressedOnPhoto,
  bringToFront,
  clampPlacement,
  dateLabel,
  dropItem,
  shelfYears,
  twoFingerTransform,
  unplacedPhotos,
  upsertItem,
  type Placement,
} from './diary';

const center: Placement = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };

test('clampPlacement 는 서버와 같은 한도로 자른다', () => {
  assert.deepEqual(clampPlacement({ x: 3, y: -2, scale: 40, rotation: 0 }), {
    x: 1.25, y: -0.25, scale: 4, rotation: 0,
  });
  assert.equal(clampPlacement({ ...center, scale: 0.01 }).scale, 0.15);
});

test('clampPlacement 는 여러 바퀴 돌린 각도를 한 바퀴 안으로 접는다', () => {
  const turned = clampPlacement({ ...center, rotation: Math.PI * 5 + 0.25 }).rotation;
  assert.ok(Math.abs(turned - (-Math.PI + 0.25)) < 1e-9);
});

test('twoFingerTransform 은 두 손가락이 벌어진 만큼 키우고 돈 만큼 돌린다', () => {
  const start = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  const now = [{ x: 0, y: 0 }, { x: 0, y: 2 }];
  const { scale, rotation, dx, dy } = twoFingerTransform(start, now);
  assert.ok(Math.abs(scale - 2) < 1e-9);
  assert.ok(Math.abs(rotation - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(dx - -0.5) < 1e-9);
  assert.ok(Math.abs(dy - 1) < 1e-9);
});

test('twoFingerTransform 은 한 손가락이면 옮기기만 한다', () => {
  assert.deepEqual(twoFingerTransform([{ x: 1, y: 1 }], [{ x: 1.5, y: 0.5 }]), {
    dx: 0.5, dy: -0.5, scale: 1, rotation: 0,
  });
});

test('twoFingerTransform 은 손가락이 한 점에 겹쳐도 무한대로 키우지 않는다', () => {
  const { scale } = twoFingerTransform([{ x: 1, y: 1 }, { x: 1, y: 1 }], [{ x: 0, y: 0 }, { x: 2, y: 2 }]);
  assert.equal(scale, 1);
});

test('bringToFront 는 새 배열을 돌려주고 고른 것을 맨 위로 올린다', () => {
  const items = [{ id: 1, layer: 0 }, { id: 2, layer: 3 }, { id: 3, layer: 1 }];
  const next = bringToFront(items, 1);
  assert.notEqual(next, items);
  assert.equal(items[0].layer, 0);
  assert.equal(next.find((item) => item.id === 1)?.layer, 4);
});

test('bringToFront 는 이미 맨 위면 그대로 둔다', () => {
  const items = [{ id: 1, layer: 0 }, { id: 2, layer: 3 }];
  assert.equal(bringToFront(items, 2), items);
});

test('unplacedPhotos 는 이 책에 이미 붙인 사진을 뺀다', () => {
  const entries = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(unplacedPhotos(entries, [2, null, 3]).map((entry) => entry.id), [1]);
});

test('dateLabel 은 사진에 붙는 짧은 날짜를 만든다', () => {
  assert.equal(dateLabel('2026-10-03'), '10.03');
  assert.equal(dateLabel(null), '');
});

test('shelfYears 는 올해 책이 아직 없어도 올해 자리를 맨 앞에 둔다', () => {
  assert.deepEqual(shelfYears([2025], 2026), [2026, 2025]);
  assert.deepEqual(shelfYears([2026, 2024], 2026), [2026, 2024]);
  assert.deepEqual(shelfYears([], 2026), [2026]);
});

const pages = {
  book: { id: 1 },
  pages: [
    { id: 10, position: 0, items: [{ id: 1, layer: 0 }, { id: 2, layer: 1 }] },
    { id: 11, position: 1, items: [] },
  ],
};

test('upsertItem 은 그 페이지의 같은 것을 갈아 끼우고 없으면 붙인다', () => {
  const replaced = upsertItem(pages, 10, { id: 2, layer: 9 });
  assert.equal(replaced.pages[0].items.find((item) => item.id === 2)?.layer, 9);
  assert.equal(pages.pages[0].items[1].layer, 1);
  const added = upsertItem(pages, 11, { id: 3, layer: 0 });
  assert.deepEqual(added.pages[1].items.map((item) => item.id), [3]);
});

test('dropItem 은 어느 페이지에 있든 그것만 뗀다', () => {
  const next = dropItem(pages, 1);
  assert.deepEqual(next.pages[0].items.map((item) => item.id), [2]);
  assert.equal(pages.pages[0].items.length, 2);
});

test('appendPage 는 맨 뒤에 새 페이지를 붙인다', () => {
  const next = appendPage(pages, { id: 12, position: 2, items: [] as { id: number; layer: number }[] });
  assert.deepEqual(next.pages.map((page) => page.id), [10, 11, 12]);
  assert.equal(pages.pages.length, 2);
});

test('cutoutFrame 은 누른 자리를 서버가 받는 이름으로 적는다', () => {
  assert.equal(cutoutFrame({ x: 0.423, y: 0.6 }), 'cutout-42-60');
  assert.equal(cutoutFrame({ x: -0.2, y: 1.4 }), 'cutout-0-100');
  assert.match(cutoutFrame({ x: 1, y: 1 }), /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(cutoutFrame({ x: 1, y: 1 }).length <= 16);
});

test('cutoutPoint 는 누끼 이름에서 누른 자리를 되읽는다', () => {
  assert.deepEqual(cutoutPoint('cutout-42-60'), { x: 0.42, y: 0.6 });
  assert.equal(cutoutPoint('cutout'), 'whole');
  assert.equal(cutoutPoint('polaroid'), null);
  assert.equal(cutoutPoint(null), null);
  assert.equal(cutoutPoint('cutout-abc'), null);
});

test('pressedOnPhoto 는 가운데를 잘라 보여 준 사진에서 원본의 자리를 찾는다', () => {
  const square = { x: -50, y: -60, size: 100 };
  /* 가로로 긴 사진은 양옆이 잘려 있다. 보이는 정사각형의 가운데는 원본의 가운데다. */
  assert.deepEqual(pressedOnPhoto({ x: 0, y: -10 }, square, { width: 400, height: 200 }), { x: 0.5, y: 0.5 });
  assert.deepEqual(pressedOnPhoto({ x: -50, y: -60 }, square, { width: 400, height: 200 }), { x: 0.25, y: 0 });
  assert.equal(pressedOnPhoto({ x: 60, y: 0 }, square, { width: 400, height: 200 }), null);
});

test('pivotTransform 은 손잡이를 끈 만큼 가운데를 축으로 키우고 돌린다', () => {
  const pivot = { x: 0, y: 0 };
  assert.deepEqual(pivotTransform(pivot, { x: 10, y: 0 }, { x: 10, y: 0 }), { scale: 1, rotation: 0 });
  assert.deepEqual(pivotTransform(pivot, { x: 10, y: 0 }, { x: 20, y: 0 }), { scale: 2, rotation: 0 });
  const turned = pivotTransform(pivot, { x: 10, y: 0 }, { x: 0, y: 10 });
  assert.ok(Math.abs(turned.scale - 1) < 1e-9 && Math.abs(turned.rotation - Math.PI / 2) < 1e-9);
});

test('pivotTransform 은 손잡이가 축에 닿으면 그대로 둔다', () => {
  assert.deepEqual(pivotTransform({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }), { scale: 1, rotation: 0 });
});
