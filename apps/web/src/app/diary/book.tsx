/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { constrainToSpine, foldFromDrag, turnProgress, type Point } from '@/lib/curl';
import { approach } from '@/lib/motion';
import { createBook, LEAF_GAP } from './gl/book-model';
import { createSheet } from './gl/page-curl';
import { blankTexture, coverTexture, pageTexture } from './gl/spike-art';
import { createStage } from './gl/stage';

const PAGE = { width: 1, height: 1.4 };
const SHEETS = 4;
const CURL_RADIUS = PAGE.width * 0.16;
const SETTLE_RATE = 12;
/* 거의 제자리에 왔으면 붙인다. 지수 감쇠는 끝이 길어서, 남은 작은 접힘이 겹친 종이와
   깜빡이며 지지직거렸다. */
const SNAP = 0.003;
/* 이보다 덜 끈 접힘은 원통이 너무 작아 종이 두께 안에서 떨기만 한다. */
const MIN_FOLD = 0.004;
const CLOSED_VIEW = PAGE.width * 1.3;
const OPEN_VIEW = PAGE.width * 2.25;
/* 이만큼 넘겼으면 손을 떼도 끝까지 넘어간다. */
const COMMIT_AT = 0.3;
const TAP_SLOP = 0.02;
/* 책등에 바짝 붙은 곳을 잡으면 조금만 움직여도 다 넘어가 버린다. */
const MIN_GRAB_X = PAGE.width * 0.2;

type Leaf = { turned: boolean; grab: Point; finger: Point };
type Drag = { index: number; fromRight: boolean; start: Point };

const mirror = ({ x, y }: Point): Point => ({ x: -x, y });
const goalOf = (leaf: Leaf): Point => (leaf.turned ? mirror(leaf.grab) : leaf.grab);
const gap = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

function settle(leaf: Leaf, seconds: number, instantly: boolean): Point {
  const goal = goalOf(leaf);
  if (instantly || gap(leaf.finger, goal) < SNAP) return goal;
  return {
    x: approach(leaf.finger.x, goal.x, seconds, SETTLE_RATE),
    y: approach(leaf.finger.y, goal.y, seconds, SETTLE_RATE),
  };
}

function mountBook(canvas: HTMLCanvasElement): () => void {
  const stage = createStage(canvas, { width: CLOSED_VIEW, height: PAGE.height * 1.2 });
  const font = getComputedStyle(document.body).fontFamily;

  const book = createBook(PAGE, { outside: coverTexture(font), inside: blankTexture() }, SHEETS);
  const sheets = Array.from({ length: SHEETS }, (_, i) =>
    createSheet(PAGE, pageTexture(i * 2, font), pageTexture(i * 2 + 1, font)));
  stage.scene.add(book.group, ...sheets.map((sheet) => sheet.group));

  /* 0 번은 표지다. 휘지 않고 판으로 돈다. */
  const leaves: Leaf[] = Array.from({ length: SHEETS + 1 }, () => ({
    turned: false, grab: { x: PAGE.width, y: PAGE.height / 2 }, finger: { x: PAGE.width, y: PAGE.height / 2 },
  }));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drag: Drag | null = null;

  const local = (event: PointerEvent): Point | null => {
    const point = stage.toTable(event.clientX, event.clientY);
    return point ? { x: point.x, y: point.y + PAGE.height / 2 } : null;
  };

  const onDown = (event: PointerEvent) => {
    const point = local(event);
    if (!point || Math.abs(point.x) > PAGE.width || point.y < 0 || point.y > PAGE.height) return;
    const fromRight = point.x >= 0;
    const index = fromRight ? leaves.findIndex((leaf) => !leaf.turned) : leaves.map((leaf) => leaf.turned).lastIndexOf(true);
    if (index < 0) return;
    canvas.setPointerCapture(event.pointerId);
    const onPage = fromRight ? point : mirror(point);
    const grab = { x: Math.max(MIN_GRAB_X, onPage.x), y: onPage.y };
    /* 누르는 순간에는 아무것도 움직이지 않는다. 손가락을 grab 의 제자리에 둬야 책등 근처를
       눌러도 페이지가 들썩이지 않는다. */
    leaves[index] = { ...leaves[index], grab, finger: fromRight ? grab : mirror(grab) };
    drag = { index, fromRight, start: point };
  };

  const onMove = (event: PointerEvent) => {
    const point = local(event);
    if (!drag || !point) return;
    const leaf = leaves[drag.index];
    const finger = drag.index === 0 ? point : constrainToSpine(leaf.grab, point, PAGE);
    leaves[drag.index] = { ...leaf, finger };
  };

  const onUp = (event: PointerEvent) => {
    if (!drag) return;
    const leaf = leaves[drag.index];
    const point = local(event) ?? drag.start;
    /* 탭으로는 넘기지 않는다. 사진이나 스티커를 누르려던 손이 책장을 넘겨 버리면 안 된다. */
    const tapped = Math.hypot(point.x - drag.start.x, point.y - drag.start.y) < TAP_SLOP;
    const progress = turnProgress(leaf.grab, leaf.finger);
    const turned = tapped ? leaf.turned : progress > (drag.fromRight ? COMMIT_AT : 1 - COMMIT_AT);
    leaves[drag.index] = { ...leaf, turned };
    drag = null;
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  /* 지난 프레임에 그린 손가락 자리. 그대로면 정점을 다시 계산하지 않는다. */
  const drawn: (Point | null)[] = leaves.map(() => null);
  let coverDrawn = -1;

  stage.run((seconds) => {
    let moved = false;
    leaves.forEach((leaf, i) => {
      if (drag?.index !== i) leaves[i] = { ...leaf, finger: settle(leaf, seconds, reduceMotion) };
    });

    const cover = turnProgress(leaves[0].grab, leaves[0].finger);
    if (cover !== coverDrawn) {
      coverDrawn = cover;
      book.openCover(cover);
      /* 닫힌 책은 표지가 가운데, 펼친 책은 책등이 가운데다. 여는 만큼 카메라가 따라간다. */
      stage.frame({
        x: (PAGE.width / 2) * (1 - cover),
        width: CLOSED_VIEW + (OPEN_VIEW - CLOSED_VIEW) * cover,
        height: PAGE.height * 1.2,
      });
      moved = true;
    }

    sheets.forEach((sheet, i) => {
      const { grab, finger } = leaves[i + 1];
      const last = drawn[i + 1];
      if (last && gap(last, finger) < 1e-6) return;
      drawn[i + 1] = finger;
      moved = true;

      const progress = turnProgress(grab, finger);
      const fold = gap(grab, finger) < MIN_FOLD ? null : foldFromDrag(grab, finger, CURL_RADIUS * (1 - progress));
      const right = book.restZ + (SHEETS - i) * LEAF_GAP;
      const left = book.restZ + (i + 1) * LEAF_GAP;
      /* 가만히 놓인 종이끼리는 그림자를 주고받지 않는다. 0.0025 간격에서 서로 얼룩진다. */
      sheet.meshes.forEach((mesh) => {
        mesh.castShadow = progress > 0 && progress < 1;
      });
      sheet.shape(fold, right + (left - right) * progress);
    });
    return moved;
  });

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    sheets.forEach((sheet) => sheet.dispose());
    book.dispose();
    stage.dispose();
  };
}

export default function Book() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let unmount: (() => void) | undefined;
    let gone = false;
    /* 캔버스에 글씨를 그릴 때 폰트가 아직 없으면 시스템 폰트로 굳어 버린다. */
    void document.fonts.ready.then(() => {
      if (!gone) unmount = mountBook(canvas);
    });
    return () => {
      gone = true;
      unmount?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      css={css`
        display: block;
        width: 100%;
        height: 100%;
        touch-action: none;
      `}
    />
  );
}
