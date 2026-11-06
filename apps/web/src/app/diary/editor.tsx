/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DiaryItem, DiaryPage } from '@/lib/api/diary';
import {
  bringToFront, clampPlacement, cutoutPoint, pivotTransform, pressedOnPhoto, twoFingerTransform, type Placement, type Point,
} from '@/lib/diary';
import { createStickerStage, type StickerStage } from './gl/sticker-stage';
import { drawPaper, itemBounds, LIFT_MS, PAGE_PX, photoSquare, type Images } from './page-art';

/* 이만큼 덜 움직였으면 누른 것으로 친다. 저장할 것도 없다. */
const TAP_SLOP = 0.01;

type Gesture = {
  id: number;
  start: Placement;
  /** 지금 화면에 닿아 있는 손가락들이 처음 닿은 자리. 손가락 수가 바뀌면 거기서 다시 잰다. */
  from: Map<number, Point>;
  now: Map<number, Point>;
  moved: boolean;
  /** 처음 손댄 것. 움직이지 않고 떼면 이것을 고른다. 빈 종이면 null 이라 고른 것을 놓는다. */
  tapped: number | null;
  /** 모서리 손잡이로 잡았으면 그 가운데(페이지 픽셀). 한 손가락으로 돌리고 키운다. */
  pivot?: Point;
};

type Props = {
  page: DiaryPage;
  images: Images;
  font: string;
  /** 놓은 자리를 저장한다. 실패하면 화면이 서버 상태로 되돌아간다. */
  onPlace: (item: DiaryItem) => void;
  onRemove: (id: number) => void;
  /** 사진을 꾹 누른 자리(원본 사진의 비율 좌표)의 피사체를 떼어 낸다. */
  onLift: (item: DiaryItem, point: Point) => void;
  /** 있으면 크게 보기만 하는 화면이다. 만져도 움직이지 않고, 이것을 눌러야 꾸민다. */
  onEdit?: () => void;
  /** 방금 붙인 것. 착 붙는 모습을 한 번 보여준다. */
  fresh: number | null;
};

/* 모눈 선이 1px 아래로 가늘어서, 화면 배율만큼 크게 그려야 번지지 않는다. */
const PAPER_SCALE = 3;

function Paper({ view }: { view: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const paint = ref.current?.getContext('2d');
    if (!paint) return;
    paint.setTransform(PAPER_SCALE, 0, 0, PAPER_SCALE, 0, 0);
    drawPaper(paint);
  }, []);
  return (
    <canvas
      ref={ref}
      width={PAGE_PX.width * PAPER_SCALE}
      height={PAGE_PX.height * PAPER_SCALE}
      style={{ width: PAGE_PX.width * view, height: PAGE_PX.height * view }}
      css={css`position: absolute; inset: 0; border-radius: 0.25rem; box-shadow: 0 0.5rem 1.5rem rgba(90, 77, 68, 0.18);`}
    />
  );
}

export default function Editor({ page, images, font, onPlace, onRemove, onLift, onEdit, fresh }: Props) {
  const looking = onEdit !== undefined;
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(1);
  const [items, setItems] = useState(page.items);
  const [selected, setSelected] = useState<number | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const glass = useRef<HTMLCanvasElement>(null);
  const stage = useRef<StickerStage | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);

  const release = () => {
    if (press.current) clearTimeout(press.current);
    press.current = null;
  };

  /** 누른 페이지 자리를 그 사진의 원본 좌표로 바꾼다. 사진 칸 밖(틀, 날짜)이면 null 이다. */
  const onPhoto = (item: DiaryItem, at: Point): Point | null => {
    const image = item.entryId === null ? undefined : images.get(item.entryId);
    if (!image) return null;
    const dx = (at.x - item.x) * PAGE_PX.width;
    const dy = (at.y - item.y) * PAGE_PX.height;
    const cos = Math.cos(item.rotation);
    const sin = Math.sin(item.rotation);
    const local = { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
    return pressedOnPhoto(local, photoSquare(item, font), { width: image.naturalWidth, height: image.naturalHeight });
  };

  useEffect(() => setItems(page.items), [page.items]);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return undefined;
    /* clientWidth 는 안쪽 여백을 포함한다. 빼지 않으면 페이지가 화면 밖으로 넘친다. */
    const fit = () => {
      const style = getComputedStyle(element);
      const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setView(Math.min(width / PAGE_PX.width, height / PAGE_PX.height));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!glass.current) return undefined;
    const created = createStickerStage(glass.current);
    stage.current = created;
    return () => {
      created.dispose();
      stage.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const page = frame.current?.querySelector('[data-page]')?.getBoundingClientRect();
    const outer = frame.current?.getBoundingClientRect();
    if (!page || !outer) return;
    stage.current?.sync(items, { left: page.left - outer.left, top: page.top - outer.top, view }, images, font, fresh);
  }, [items, view, images, font, fresh]);

  /** 화면 좌표를 페이지 비율 좌표로. 회전과 배율은 비율이라 그대로다. */
  const onPage = (event: PointerEvent | React.PointerEvent): Point => {
    const rect = frame.current?.querySelector('[data-page]')?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const begin = (item: DiaryItem, event: React.PointerEvent, tapped: number | null = item.id) => {
    event.stopPropagation();
    frame.current?.setPointerCapture(event.pointerId);
    if (selected === null) setSelected(item.id);
    const point = onPage(event);
    const live = gesture.current?.id === item.id ? gesture.current : null;
    const now = new Map(live?.now ?? []);
    now.set(event.pointerId, point);
    const current = items.find((candidate) => candidate.id === item.id) ?? item;
    /* 잡는 순간 맨 위로 올린다. 다른 스티커 밑에 깔린 채 끌리면 손에 든 느낌이 없다. */
    setItems((all) => bringToFront(all, item.id) as DiaryItem[]);
    gesture.current = { id: item.id, start: current, from: new Map(now), now, moved: live?.moved ?? false, tapped: live?.tapped ?? tapped };
    stage.current?.hold(item.id, point);
    release();
    if (now.size !== 1 || current.kind !== 'PHOTO' || cutoutPoint(current.frame) !== null) return;
    press.current = setTimeout(() => {
      const held = gesture.current;
      if (!held || held.moved || held.now.size !== 1) return;
      const spot = onPhoto(current, [...held.now.values()][0]);
      if (!spot) return;
      gesture.current = null;
      stage.current?.hold(null);
      onLift(current, spot);
    }, LIFT_MS);
  };

  const move = (event: React.PointerEvent) => {
    const live = gesture.current;
    if (!live || !live.now.has(event.pointerId)) return;
    live.now.set(event.pointerId, onPage(event));
    const px = (point: Point): Point => ({ x: point.x * PAGE_PX.width, y: point.y * PAGE_PX.height });
    const { dx, dy, scale, rotation } = live.pivot
      ? { dx: 0, dy: 0, ...pivotTransform(live.pivot, px([...live.from.values()][0]), px([...live.now.values()][0])) }
      : twoFingerTransform([...live.from.values()], [...live.now.values()]);
    if (Math.hypot(dx, dy) > TAP_SLOP || Math.abs(scale - 1) > TAP_SLOP || Math.abs(rotation) > TAP_SLOP) {
      live.moved = true;
      release();
    }
    const placed = clampPlacement({
      x: live.start.x + dx,
      y: live.start.y + dy,
      scale: live.start.scale * scale,
      rotation: live.start.rotation + rotation,
    });
    setItems((all) => all.map((item) => (item.id === live.id ? { ...item, ...placed } : item)));
  };

  const end = (event: React.PointerEvent) => {
    const live = gesture.current;
    if (!live || !live.now.has(event.pointerId)) return;
    live.now.delete(event.pointerId);
    const placed = items.find((item) => item.id === live.id);
    if (live.now.size > 0 && placed) {
      /* 손가락 하나를 떼도 남은 손가락으로 이어서 옮긴다. 거기서부터 다시 잰다. */
      gesture.current = { ...live, start: placed, from: new Map(live.now) };
      return;
    }
    release();
    gesture.current = null;
    stage.current?.hold(null);
    if (placed && live.moved) onPlace(placed);
    if (!live.moved) setSelected(live.tapped);
  };

  const ordered = [...items].sort((a, b) => a.layer - b.layer || a.id - b.id);

  return (
    <div
      ref={frame}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onPointerDown={(event) => {
        if (looking) return;
        /* 작은 스티커 위에 두 손가락을 다 올리기는 어렵다. 고른 것이 있으면 빈 종이에 닿아도 그것을 다룬다. */
        const held = items.find((item) => item.id === (gesture.current?.id ?? selected));
        if (held) begin(held, event, null);
        else setSelected(null);
      }}
      css={css`
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        /* 탭바가 main 아래쪽 약 4rem 을 덮는다. 종이와 버튼이 그 밑에 깔리지 않게 비켜 둔다. */
        padding: calc(var(--native-header) + 1.25rem) 1rem ${looking ? '10rem' : '5rem'};
        background: var(--diary-desk);
        touch-action: none;
      `}
    >
      {looking && (
        <button
          type="button"
          onClick={onEdit}
          onPointerDown={(event) => event.stopPropagation()}
          css={css`
            position: absolute;
            z-index: 2;
            bottom: 5rem;
            left: 50%;
            transform: translateX(-50%);
            padding: 0.875rem 2.5rem;
            border: 0;
            border-radius: var(--radius-pill);
            background: var(--color-foreground);
            color: var(--color-background);
            box-shadow: 0 0.5rem 1.25rem rgba(90, 77, 68, 0.25);
            transition: transform var(--duration-fast) var(--ease-out-expo);
            &:active { transform: translateX(-50%) scale(0.95); }
          `}
        >
          {page.items.length === 0 ? '이 면 꾸미기' : '편집하기'}
        </button>
      )}
      <div data-page style={{ width: PAGE_PX.width * view, height: PAGE_PX.height * view }} css={css`position: relative; overflow: visible;`}>
        <Paper view={view} />
        {ordered.map((item) => {
          const lifted = gesture.current?.id === item.id;
          const bounds = itemBounds(item, font);
          return (
            <div
              key={item.id}
              onPointerDown={(event) => {
                if (looking) return;
                /* 하나를 골라 두면 다른 것 위에서 손을 대도 고른 것만 움직인다. 짧게 탭하면 그것으로 바꾼다. */
                const held = items.find((candidate) => candidate.id === (gesture.current?.id ?? selected));
                begin(held ?? item, event, item.id);
              }}
              style={{
                transform: `translate(${item.x * PAGE_PX.width * view}px, ${item.y * PAGE_PX.height * view}px) translate(-50%, -50%) rotate(${item.rotation}rad)`,
              }}
              /* 고른 것의 점선이 다른 사진 밑에 깔리지 않게 그림(z-index 1) 위로 올린다. */
              css={css`position: absolute; left: 0; top: 0; z-index: ${selected === item.id ? 2 : 'auto'};`}
            >
              <div
                style={{ width: bounds.width * view, height: bounds.height * view }}
                css={css`
                  outline: ${selected === item.id && !lifted ? '0.125rem dashed var(--color-muted)' : 'none'};
                  outline-offset: 0.5rem;
                `}
              />
              {selected === item.id && !lifted && (
                <button
                  type="button"
                  aria-label="떼기"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => {
                    setItems((all) => all.filter((candidate) => candidate.id !== item.id));
                    setSelected(null);
                    onRemove(item.id);
                  }}
                  css={css`
                    position: absolute;
                    z-index: 2;
                    top: -1rem;
                    right: -1rem;
                    width: 2rem;
                    height: 2rem;
                    border: 0;
                    border-radius: var(--radius-pill);
                    background: var(--color-foreground);
                    color: var(--color-background);
                  `}
                >
                  ×
                </button>
              )}
              {selected === item.id && !lifted && (
                <button
                  type="button"
                  aria-label="돌리고 크기 바꾸기"
                  onPointerDown={(event) => {
                    begin(item, event, item.id);
                    const live = gesture.current;
                    if (live) live.pivot = { x: item.x * PAGE_PX.width, y: item.y * PAGE_PX.height };
                  }}
                  css={css`
                    position: absolute;
                    z-index: 2;
                    right: -1rem;
                    bottom: -1rem;
                    width: 2rem;
                    height: 2rem;
                    border: 0.125rem solid var(--color-foreground);
                    border-radius: var(--radius-pill);
                    background: var(--color-background);
                    color: var(--color-foreground);
                    touch-action: none;
                  `}
                >
                  ↻
                </button>
              )}
            </div>
          );
        })}
      </div>
      <canvas
        ref={glass}
        aria-hidden="true"
        css={css`position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; pointer-events: none;`}
      />
    </div>
  );
}
