/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { bend, curlAt, foldFromDrag, type Fold, type Point } from '@/lib/curl';
import { approach } from '@/lib/motion';
import { blankTexture, pageTexture, STICKER_COLORS, stickerTexture } from './gl/spike-art';
import { createSticker, type Sticker } from './gl/sticker-peel';
import { createStage } from './gl/stage';

const SIZE = 0.22;
const STICKER = { width: SIZE, height: SIZE };
const TRAY_Y = -0.66;
const CURL_RADIUS = SIZE * 0.18;
/* 잡은 점을 이만큼 끌면 스티커가 종이에서 완전히 떨어진다. 그 전까지는 잡은 곳만 들린다. */
const DETACH_AT = SIZE * 0.45;
/* 떨어진 뒤에도 잡은 모서리는 살짝 말려 있다. 다 펴면 손에 든 느낌이 사라진다. */
const HELD_SWEEP = 1.1;
const HELD_LIFT = 0.12;
const PRESS = 1.08;
const RATE = { curl: 14, sweep: 10, lift: 12, press: 18 };

/* drag: 아직 붙어 있어 잡은 점이 손가락을 따라간다. hold: 떼어 들고 있거나 내려놓는 중이다. */
type Motion = {
  mode: 'drag' | 'hold'; grab: Point; finger: Point; direction: Point; sweep: number; lift: number; scale: number;
};
/* touch 는 손가락이 처음 닿은 스티커 위의 점이다. 들고 다니는 동안 이 점이 손가락 밑에 있다. */
type Held = { index: number; detached: boolean; pointer: Point; touch: Point };

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const lengthOf = ({ x, y }: Point): number => Math.hypot(x, y);
const toward = (from: Point, to: Point, rate: number, seconds: number): Point => ({
  x: approach(from.x, to.x, seconds, rate),
  y: approach(from.y, to.y, seconds, rate),
});
const CENTER: Point = { x: SIZE / 2, y: SIZE / 2 };

/** 손이 닿은 곳에서 가장 가까운 모서리. 스티커는 모서리부터 뗀다. 가운데를 잡은 점을
    그대로 끌면 그 바깥쪽 절반이 한 번에 탁 접힌다. */
const cornerNear = (touch: Point): Point => ({ x: touch.x < CENTER.x ? 0 : SIZE, y: touch.y < CENTER.y ? 0 : SIZE });

function foldOf(state: Motion): Fold | null {
  if (state.mode === 'drag') return foldFromDrag(state.grab, state.finger, CURL_RADIUS);
  return state.sweep > 1e-3 ? curlAt(state.grab, state.direction, CURL_RADIUS, state.sweep) : null;
}

/** 붙어 있을 때 접힌 모양 그대로 들고 다니는 모양으로 넘긴다. 각도가 끊기면 툭 바뀐다. */
function holdFrom(state: Motion): Motion {
  const fold = foldFromDrag(state.grab, state.finger, CURL_RADIUS);
  if (!fold) return { ...state, mode: 'hold', sweep: 0 };
  const direction = { x: Math.cos(fold.angle), y: Math.sin(fold.angle) };
  const wrapped = (state.grab.x - fold.x) * direction.x + (state.grab.y - fold.y) * direction.y;
  return { ...state, mode: 'hold', direction, sweep: Math.min(Math.PI, wrapped / CURL_RADIUS) };
}

function mountPeel(canvas: HTMLCanvasElement): () => void {
  const stage = createStage(canvas, { width: 1.15, height: 1.75 }, { tilt: 0.1 });
  const font = getComputedStyle(document.body).fontFamily;

  const page = new Mesh(new PlaneGeometry(1, 1.4), new MeshStandardMaterial({ map: pageTexture(2, font), roughness: 0.95 }));
  page.position.set(0, 0.12, 0);
  page.receiveShadow = true;
  const tray = new Mesh(new PlaneGeometry(1.1, 0.34), new MeshStandardMaterial({ map: blankTexture(), roughness: 1 }));
  tray.position.set(0, TRAY_Y, 0.002);
  stage.scene.add(page, tray);

  const stickers: Sticker[] = STICKER_COLORS.map((color, i) => {
    const sticker = createSticker(STICKER, stickerTexture(color));
    sticker.group.position.set(-0.45 + i * 0.25, TRAY_Y - SIZE / 2, 0.004);
    stage.scene.add(sticker.group);
    return sticker;
  });
  const motion: Motion[] = stickers.map(() => ({
    mode: 'drag', grab: CENTER, finger: CENTER, direction: { x: 1, y: 0 }, sweep: 0, lift: 0, scale: 1,
  }));
  let held: Held | null = null;

  const toLocal = (index: number, world: Point): Point => {
    const { position } = stickers[index].group;
    return { x: world.x - position.x, y: world.y - position.y };
  };

  const onDown = (event: PointerEvent) => {
    const [hit] = stage.pick(event.clientX, event.clientY, stickers.map((sticker) => sticker.hit));
    const index = stickers.findIndex((sticker) => sticker.hit === hit?.object);
    const world = stage.toTable(event.clientX, event.clientY);
    if (index < 0 || !world) return;
    canvas.setPointerCapture(event.pointerId);
    const touch = toLocal(index, world);
    const grab = cornerNear(touch);
    motion[index] = { ...motion[index], mode: 'drag', grab, finger: grab, sweep: 0 };
    held = { index, detached: false, pointer: world, touch };
    /* 집은 것이 다른 스티커 아래에 깔리지 않게 그리는 순서를 맨 뒤로 보낸다. */
    stage.scene.remove(stickers[index].group);
    stage.scene.add(stickers[index].group);
  };

  const onMove = (event: PointerEvent) => {
    const world = stage.toTable(event.clientX, event.clientY);
    if (!held || !world) return;
    held = { ...held, pointer: world };
    if (held.detached) return;
    const state = motion[held.index];
    const pulled = subtract(toLocal(held.index, world), held.touch);
    if (lengthOf(pulled) < DETACH_AT) {
      motion[held.index] = { ...state, finger: add(state.grab, pulled) };
      return;
    }
    motion[held.index] = holdFrom(state);
    held = { ...held, detached: true };
  };

  const onUp = () => {
    if (!held) return;
    if (held.detached) motion[held.index] = { ...motion[held.index], scale: PRESS };
    held = null;
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  stage.run((seconds) => {
    stickers.forEach((sticker, i) => {
      const state = motion[i];
      const mine = held?.index === i ? held : null;
      const next: Motion = {
        ...state,
        finger: mine && !mine.detached ? state.finger : toward(state.finger, state.grab, RATE.curl, seconds),
        sweep: approach(state.sweep, mine?.detached ? HELD_SWEEP : 0, seconds, RATE.sweep),
        lift: approach(state.lift, mine?.detached ? HELD_LIFT : 0, seconds, RATE.lift),
        scale: approach(state.scale, 1, seconds, RATE.press),
      };
      motion[i] = next;
      const fold = foldOf(next);

      /* 떨어진 스티커는 처음 손이 닿은 점이 늘 손가락 밑에 오도록 통째로 옮긴다. */
      if (mine?.detached) {
        const { touch } = mine;
        const [x, y] = fold ? bend(touch.x, touch.y, fold) : [touch.x, touch.y];
        sticker.group.position.set(mine.pointer.x - x, mine.pointer.y - y, 0.004);
      }
      sticker.group.scale.setScalar(next.scale);
      sticker.shape(fold, next.lift);
    });
    return true;
  });

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    stickers.forEach((sticker) => sticker.dispose());
    page.geometry.dispose();
    tray.geometry.dispose();
    stage.dispose();
  };
}

export default function Peel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let unmount: (() => void) | undefined;
    let gone = false;
    void document.fonts.ready.then(() => {
      if (!gone) unmount = mountPeel(canvas);
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
