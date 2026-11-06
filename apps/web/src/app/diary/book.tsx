/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import type { Texture } from 'three';
import type { Book as BookData, DiaryPage } from '@/lib/api/diary';
import { clampToTurn, constrainToSpine, foldFromDrag, hugSpine, turnProgress, type Point } from '@/lib/curl';
import { spring, velocityOf, type Sample, type Spring } from '@/lib/motion';
import { createBook, LEAF_GAP } from './gl/book-model';
import { coverTexture, endpaperTexture, sideTexture } from './gl/cover-art';
import { createSheet } from './gl/page-curl';
import { createStage } from './gl/stage';
import { loadHand } from './hand';
import type { Images } from './page-art';

const PAGE = { width: 1, height: 1.4 };
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
const TAP_SLOP = 0.02;
const CLOSED_VIEW = PAGE.width * 1.3;
const OPEN_VIEW = PAGE.width * 2.25;
/* 펼친 곳에서 이만큼 떨어진 장까지만 그림을 들고 있는다. 한 면이 0.7MB 라 다 들면 수백 MB 다. */
const PAINTED_AROUND = 2;

type Leaf = { turned: boolean; grab: Point; x: Spring; y: Spring };
type Drag = { pointer: number; index: number; fromRight: boolean; start: Point; from: Point; samples: Sample[] };

export type Art = { book: BookData; pages: readonly DiaryPage[]; images: Images };

type Controller = { repaint: (art: Art) => void; turned: () => number; dispose: () => void };

const still = (value: number): Spring => ({ value, velocity: 0 });
const mirror = ({ x, y }: Point): Point => ({ x: -x, y });
const fingerOf = (leaf: Leaf): Point => ({ x: leaf.x.value, y: leaf.y.value });
const goalOf = (leaf: Leaf): Point => (leaf.turned ? mirror(leaf.grab) : leaf.grab);
const gap = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/** 페이지 뒤에 빈 면을 하나 더 둔다. 거기를 눌러 새 페이지를 시작한다. */
export const sheetsFor = (pages: number): number => Math.max(1, Math.ceil((pages + 1) / 2));

function settle(leaf: Leaf, seconds: number, instantly: boolean): Leaf {
  const goal = goalOf(leaf);
  const x = instantly ? still(goal.x) : spring(leaf.x, goal.x, seconds);
  const y = instantly ? still(goal.y) : spring(leaf.y, goal.y, seconds);
  const resting = Math.abs(x.value - goal.x) + Math.abs(y.value - goal.y) < SETTLED
    && Math.abs(x.velocity) + Math.abs(y.velocity) < SETTLED * 10;
  return resting ? { ...leaf, x: still(goal.x), y: still(goal.y) } : { ...leaf, x, y };
}

type Mount = { sheets: number; turned: number; art: Art; font: string; onTap: (side: number) => void };

function mountBook(canvas: HTMLCanvasElement, { sheets: count, turned: initiallyTurned, art, font, onTap }: Mount): Controller {
  const stage = createStage(canvas, { width: CLOSED_VIEW, height: PAGE.height * 1.2 });
  const blank = sideTexture(null, new Map(), font);
  let cover = coverTexture(font, art.book.coverColor, art.book.year);
  const endpaper = endpaperTexture(font, art.book.coverColor, art.book.year, art.book.shared);
  const book = createBook(PAGE, { outside: cover, inside: endpaper }, count);
  const sheets = Array.from({ length: count }, () => createSheet(PAGE, blank, blank));
  stage.scene.add(book.group, ...sheets.map((sheet) => sheet.group));

  const edge = { x: PAGE.width, y: PAGE.height / 2 };
  /* 0 번은 표지다. 휘지 않고 판으로 돈다. 다시 그려도 펼쳐 둔 자리를 잃지 않는다. */
  const leaves: Leaf[] = Array.from({ length: count + 1 }, (_, i) => {
    const turned = i < initiallyTurned;
    const at = turned ? mirror(edge) : edge;
    return { turned, grab: edge, x: still(at.x), y: still(at.y) };
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drag: Drag | null = null;
  let current = art;
  const painted = new Map<number, Texture>();

  /** 펼친 곳 근처 장만 그림을 입히고 멀어진 장은 빈 종이로 돌린다. */
  const paintAround = () => {
    const open = leaves.filter((leaf) => leaf.turned).length;
    sheets.forEach((sheet, i) => {
      const near = Math.abs(i + 1 - open) <= PAINTED_AROUND;
      const sides = [i * 2, i * 2 + 1];
      sides.forEach((side) => {
        if (near && !painted.has(side)) painted.set(side, sideTexture(current.pages[side] ?? null, current.images, font));
        if (!near && painted.has(side)) {
          painted.get(side)?.dispose();
          painted.delete(side);
        }
      });
      sheet.paint(painted.get(sides[0]) ?? blank, painted.get(sides[1]) ?? blank);
    });
  };
  paintAround();

  const local = (event: PointerEvent): Point | null => {
    const point = stage.toTable(event.clientX, event.clientY);
    return point ? { x: point.x, y: point.y + PAGE.height / 2 } : null;
  };

  /*
   * 어디를 잡든 그 높이의 바깥 가장자리를 잡은 것으로 친다. 가운데를 잡은 점을 그대로
   * 손가락에 붙이면 그 바깥쪽 절반이 한 번에 뒤집혀 탁 접힌다.
   */
  const onDown = (event: PointerEvent) => {
    /* 앞 손가락의 뗌을 놓쳤으면 그 장이 넘기던 모양 그대로 굳는다. 새로 닿으면 먼저 제자리로 보낸다. */
    if (drag && drag.pointer !== event.pointerId) finish(null, event.timeStamp);
    const point = local(event);
    if (drag || !point || Math.abs(point.x) > PAGE.width || point.y < 0 || point.y > PAGE.height) return;
    const fromRight = point.x >= 0;
    const index = fromRight ? leaves.findIndex((leaf) => !leaf.turned) : leaves.map((leaf) => leaf.turned).lastIndexOf(true);
    if (index < 0) return;
    canvas.setPointerCapture(event.pointerId);
    const grab = { x: PAGE.width, y: point.y };
    const from = fromRight ? grab : mirror(grab);
    leaves[index] = { ...leaves[index], grab, x: still(from.x), y: still(from.y) };
    drag = { pointer: event.pointerId, index, fromRight, start: point, from, samples: [{ time: event.timeStamp, x: point.x }] };
  };

  const onMove = (event: PointerEvent) => {
    const point = local(event);
    if (!drag || !point || event.pointerId !== drag.pointer) return;
    const leaf = leaves[drag.index];
    /* 위아래로 끈 만큼 따라가면 접힌 선이 기울어, 책등 쪽에 넘어가는 장 앞면이 삼각형으로 남는다.
       그 띠가 아래 장을 뚫고 나온 사진처럼 보인다. 옆으로만 따라가 접힌 선을 늘 세로로 세운다. */
    const pulled = { x: drag.from.x + point.x - drag.start.x, y: drag.from.y };
    const finger = drag.index === 0 ? pulled : constrainToSpine(leaf.grab, pulled, PAGE);
    drag = { ...drag, samples: [...drag.samples.slice(-12), { time: event.timeStamp, x: point.x }] };
    leaves[drag.index] = { ...leaf, x: still(finger.x), y: still(finger.y) };
  };

  /** 손을 뗀 자리(모르면 null)로 넘길지 되돌릴지 정한다. null 이면 누른 것으로 치지 않는다. */
  function finish(point: Point | null, time: number) {
    if (!drag) return;
    const { index, fromRight, start } = drag;
    const leaf = leaves[index];
    /* 누르기만 했으면 넘기지 않고 그 면을 보러 간다. 표지는 열지 않는다. */
    if (point && gap(point, start) < TAP_SLOP) {
      leaves[index] = { ...leaf, x: still(goalOf(leaf).x), y: still(goalOf(leaf).y) };
      drag = null;
      if (index > 0) onTap(fromRight ? (index - 1) * 2 : (index - 1) * 2 + 1);
      return;
    }
    const progress = turnProgress(leaf.grab, fingerOf(leaf));
    const velocity = velocityOf(drag.samples, time);
    const travelled = fromRight ? progress : 1 - progress;
    const flicked = travelled > FLICK_MIN && (fromRight ? velocity < -FLICK_SPEED : velocity > FLICK_SPEED);
    const committed = travelled > COMMIT_AT || flicked;
    const turned = fromRight ? committed : !committed;
    /* 되돌아갈 때 반대로 던지던 속도를 그대로 넘기면, 조금 연 종이가 왼쪽으로 크게 휙 넘어갔다 돌아온다.
       가야 할 쪽으로 향한 속도만 이어받는다. 넘긴 장은 왼쪽(-), 덮는 장은 오른쪽(+)으로 간다. */
    const toward = turned ? velocity < 0 : velocity > 0;
    const thrown = toward ? Math.max(-MAX_THROW, Math.min(MAX_THROW, velocity)) : 0;
    leaves[index] = { ...leaf, turned, x: { ...leaf.x, velocity: thrown } };
    drag = null;
    paintAround();
  }

  const onUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    finish(local(event), event.timeStamp);
  };
  /* 손가락이 탭바나 화면 끝으로 나가면 웹뷰가 pointerup 없이 붙잡기만 풀 때가 있다. 그때도 뗀 것이다. */
  const onLost = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    finish(null, event.timeStamp);
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('lostpointercapture', onLost);

  const drawn: (Point | null)[] = leaves.map(() => null);
  let coverDrawn = -1;

  stage.run((seconds) => {
    let moved = false;
    leaves.forEach((leaf, i) => {
      if (drag?.index !== i) leaves[i] = settle(leaf, seconds, reduceMotion);
    });

    const opened = turnProgress(leaves[0].grab, fingerOf(leaves[0]));
    if (opened !== coverDrawn) {
      coverDrawn = opened;
      book.openCover(opened);
      /* 닫힌 책은 표지가 가운데, 펼친 책은 책등이 가운데다. 여는 만큼 카메라가 따라간다. */
      stage.frame({
        x: (PAGE.width / 2) * (1 - opened),
        width: CLOSED_VIEW + (OPEN_VIEW - CLOSED_VIEW) * opened,
        height: PAGE.height * 1.2,
      });
      moved = true;
    }

    sheets.forEach((sheet, i) => {
      const { grab } = leaves[i + 1];
      /* 놓은 뒤 돌아가는 길에도 책등에 묶여 있어야 찢긴 것처럼 보이지 않는다. */
      const finger = constrainToSpine(grab, clampToTurn(grab, fingerOf(leaves[i + 1])), PAGE);
      const last = drawn[i + 1];
      if (last && gap(last, finger) < 1e-6) return;
      drawn[i + 1] = finger;
      moved = true;
      const progress = turnProgress(grab, finger);
      const pulled = gap(grab, finger) < MIN_FOLD ? null : foldFromDrag(grab, finger, CURL_RADIUS * (1 - progress));
      const fold = pulled && hugSpine(pulled, progress);
      const right = book.restZ + (count - i) * LEAF_GAP;
      const left = book.leftZ + (i + 1) * LEAF_GAP;
      /* 가만히 놓인 종이끼리는 그림자를 주고받지 않는다. 좁은 간격에서 서로 얼룩진다. */
      sheet.meshes.forEach((mesh) => {
        mesh.castShadow = progress > 0 && progress < 1;
      });
      sheet.shape(fold, right, left);
    });
    return moved;
  });

  return {
    repaint: (next) => {
      if (next.book.coverColor !== current.book.coverColor) {
        const old = cover;
        cover = coverTexture(font, next.book.coverColor, next.book.year);
        book.setCover(cover);
        old.dispose();
      }
      current = next;
      painted.forEach((texture) => texture.dispose());
      painted.clear();
      paintAround();
      stage.invalidate();
    },
    turned: () => leaves.filter((leaf) => leaf.turned).length,
    dispose: () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('lostpointercapture', onLost);
      painted.forEach((texture) => texture.dispose());
      sheets.forEach((sheet) => sheet.dispose());
      book.dispose();
      blank.dispose();
      endpaper.dispose();
      stage.dispose();
    },
  };
}

type Props = Art & {
  /** 이 책에서 펼쳐 둔 장 수. 페이지가 늘어 다시 그려도 그 자리로 돌아온다. */
  turnedRef: { current: number };
  onEdit: (side: number) => void;
};

export default function Book({ book, pages, images, turnedRef, onEdit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controller = useRef<Controller | null>(null);
  const latest = useRef({ art: { book, pages, images }, onEdit });
  latest.current = { art: { book, pages, images }, onEdit };
  const sheets = sheetsFor(pages.length);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let gone = false;
    /* 캔버스에 글씨를 그릴 때 폰트가 아직 없으면 시스템 폰트로 굳어 버린다. */
    void loadHand().then((font) => {
      if (gone) return;
      controller.current = mountBook(canvas, {
        sheets,
        turned: Math.min(turnedRef.current, sheets + 1),
        art: latest.current.art,
        font,
        onTap: (side) => latest.current.onEdit(side),
      });
    });
    return () => {
      gone = true;
      if (controller.current) turnedRef.current = controller.current.turned();
      controller.current?.dispose();
      controller.current = null;
    };
  }, [book.id, sheets, turnedRef]);

  useEffect(() => {
    controller.current?.repaint({ book, pages, images });
  }, [book, pages, images]);

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
