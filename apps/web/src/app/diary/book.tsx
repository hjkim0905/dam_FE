/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { clampToTurn, constrainToSpine, foldFromDrag, turnProgress, type Point } from '@/lib/curl';
import { spring, velocityOf, type Sample, type Spring } from '@/lib/motion';
import { createBook, LEAF_GAP } from './gl/book-model';
import { createSheet } from './gl/page-curl';
import { blankTexture, coverTexture, pageTexture } from './gl/spike-art';
import { createStage } from './gl/stage';

const PAGE = { width: 1, height: 1.4 };
const SHEETS = 4;
const CURL_RADIUS = PAGE.width * 0.16;
/* 절반은 넘겨야 넘어간다. 덜 끌고 놓으면 펴지며 돌아온다. */
const COMMIT_AT = 0.5;
/* 이보다 빠르게 튕기면 절반이 안 돼도 넘긴다. 단위는 페이지 폭 / 초. */
const FLICK_SPEED = 2.2;
/* 튕긴 것으로 치려면 이만큼은 끌었어야 한다. 스치듯 건드린 손이 책장을 넘기지 않게. */
const FLICK_MIN = 0.1;
/* 용수철에 넘길 손 빠르기의 상한. 더 빠르면 종이가 거울 자리를 크게 지나쳐 펄럭인다. */
const MAX_THROW = 6;
const SETTLED = 1e-4;
/* 이보다 덜 끈 접힘은 원통이 너무 작아 종이 두께 안에서 떨기만 한다. */
const MIN_FOLD = 0.004;
const CLOSED_VIEW = PAGE.width * 1.3;
const OPEN_VIEW = PAGE.width * 2.25;

type Leaf = { turned: boolean; grab: Point; x: Spring; y: Spring };
type Drag = { index: number; fromRight: boolean; start: Point; from: Point; samples: Sample[] };

const still = (value: number): Spring => ({ value, velocity: 0 });
const mirror = ({ x, y }: Point): Point => ({ x: -x, y });
const fingerOf = (leaf: Leaf): Point => ({ x: leaf.x.value, y: leaf.y.value });
const goalOf = (leaf: Leaf): Point => (leaf.turned ? mirror(leaf.grab) : leaf.grab);
const gap = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);


/** 놓은 종이는 용수철처럼 펴지며 제자리로 간다. 다 왔으면 멈춰 세워 더 그리지 않는다. */
function settle(leaf: Leaf, seconds: number, instantly: boolean): Leaf {
  const goal = goalOf(leaf);
  const x = instantly ? still(goal.x) : spring(leaf.x, goal.x, seconds);
  const y = instantly ? still(goal.y) : spring(leaf.y, goal.y, seconds);
  const resting = Math.abs(x.value - goal.x) + Math.abs(y.value - goal.y) < SETTLED
    && Math.abs(x.velocity) + Math.abs(y.velocity) < SETTLED * 10;
  return resting ? { ...leaf, x: still(goal.x), y: still(goal.y) } : { ...leaf, x, y };
}

function mountBook(canvas: HTMLCanvasElement): () => void {
  const stage = createStage(canvas, { width: CLOSED_VIEW, height: PAGE.height * 1.2 });
  const font = getComputedStyle(document.body).fontFamily;

  const book = createBook(PAGE, { outside: coverTexture(font), inside: blankTexture() }, SHEETS);
  const sheets = Array.from({ length: SHEETS }, (_, i) =>
    createSheet(PAGE, pageTexture(i * 2, font), pageTexture(i * 2 + 1, font)));
  stage.scene.add(book.group, ...sheets.map((sheet) => sheet.group));

  /* 0 번은 표지다. 휘지 않고 판으로 돈다. */
  const edge = { x: PAGE.width, y: PAGE.height / 2 };
  const leaves: Leaf[] = Array.from({ length: SHEETS + 1 }, () => ({
    turned: false, grab: edge, x: still(edge.x), y: still(edge.y),
  }));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drag: Drag | null = null;

  const local = (event: PointerEvent): Point | null => {
    const point = stage.toTable(event.clientX, event.clientY);
    return point ? { x: point.x, y: point.y + PAGE.height / 2 } : null;
  };

  /*
   * 어디를 잡든 그 높이의 바깥 가장자리를 잡은 것으로 친다. 가운데를 잡은 점을 그대로
   * 손가락에 붙이면 그 바깥쪽 절반이 한 번에 뒤집혀 탁 접힌다. 손가락은 움직인 만큼만
   * 가장자리를 끈다. 모서리 근처를 잡으면 가장자리 모서리가 따라와 대각선으로 말린다.
   */
  const onDown = (event: PointerEvent) => {
    const point = local(event);
    if (!point || Math.abs(point.x) > PAGE.width || point.y < 0 || point.y > PAGE.height) return;
    const fromRight = point.x >= 0;
    const index = fromRight ? leaves.findIndex((leaf) => !leaf.turned) : leaves.map((leaf) => leaf.turned).lastIndexOf(true);
    if (index < 0) return;
    canvas.setPointerCapture(event.pointerId);
    const grab = { x: PAGE.width, y: point.y };
    const from = fromRight ? grab : mirror(grab);
    leaves[index] = { ...leaves[index], grab, x: still(from.x), y: still(from.y) };
    drag = { index, fromRight, start: point, from, samples: [{ time: event.timeStamp, x: point.x }] };
  };

  const onMove = (event: PointerEvent) => {
    const point = local(event);
    if (!drag || !point) return;
    const leaf = leaves[drag.index];
    const pulled = { x: drag.from.x + point.x - drag.start.x, y: drag.from.y + point.y - drag.start.y };
    const finger = drag.index === 0 ? pulled : constrainToSpine(leaf.grab, pulled, PAGE);
    drag = { ...drag, samples: [...drag.samples.slice(-12), { time: event.timeStamp, x: point.x }] };
    leaves[drag.index] = { ...leaf, x: still(finger.x), y: still(finger.y) };
  };

  const onUp = (event: PointerEvent) => {
    if (!drag) return;
    const leaf = leaves[drag.index];
    const progress = turnProgress(leaf.grab, fingerOf(leaf));
    const velocity = velocityOf(drag.samples, event.timeStamp);
    const travelled = drag.fromRight ? progress : 1 - progress;
    const flicked = travelled > FLICK_MIN && (drag.fromRight ? velocity < -FLICK_SPEED : velocity > FLICK_SPEED);
    const committed = travelled > COMMIT_AT || flicked;
    const turned = drag.fromRight ? committed : !committed;
    /* 놓는 순간의 손 빠르기를 용수철에 넘겨야 던진 종이가 그 기세로 넘어간다. */
    const thrown = Math.max(-MAX_THROW, Math.min(MAX_THROW, velocity));
    leaves[drag.index] = { ...leaf, turned, x: { ...leaf.x, velocity: thrown } };
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
      if (drag?.index !== i) leaves[i] = settle(leaf, seconds, reduceMotion);
    });

    const cover = turnProgress(leaves[0].grab, fingerOf(leaves[0]));
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
      const { grab } = leaves[i + 1];
      /* 놓은 뒤 돌아가는 길에도 책등에 묶여 있어야 한다. 끄는 동안만 막으면 돌아가는
         직선 경로에서 종이가 늘어나 찢긴 것처럼 보인다. */
      const finger = constrainToSpine(grab, clampToTurn(grab, fingerOf(leaves[i + 1])), PAGE);
      const last = drawn[i + 1];
      if (last && gap(last, finger) < 1e-6) return;
      drawn[i + 1] = finger;
      moved = true;

      const progress = turnProgress(grab, finger);
      const fold = gap(grab, finger) < MIN_FOLD ? null : foldFromDrag(grab, finger, CURL_RADIUS * (1 - progress));
      const right = book.restZ + (SHEETS - i) * LEAF_GAP;
      const left = book.leftZ + (i + 1) * LEAF_GAP;
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
