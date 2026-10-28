/** @jsxImportSource @emotion/react */
'use client';

import { css, keyframes } from '@emotion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DiaryItem, DiaryPage } from '@/lib/api/diary';
import { bringToFront, clampPlacement, twoFingerTransform, type Placement, type Point } from '@/lib/diary';
import { drawItem, drawPaper, itemBounds, PAGE_PX, type Images } from './page-art';

/* 이만큼 덜 움직였으면 누른 것으로 친다. 저장할 것도 없다. */
const TAP_SLOP = 0.01;

type Gesture = {
  id: number;
  start: Placement;
  /** 지금 화면에 닿아 있는 손가락들이 처음 닿은 자리. 손가락 수가 바뀌면 거기서 다시 잰다. */
  from: Map<number, Point>;
  now: Map<number, Point>;
  moved: boolean;
};

type Props = {
  page: DiaryPage;
  images: Images;
  font: string;
  /** 놓은 자리를 저장한다. 실패하면 화면이 서버 상태로 되돌아간다. */
  onPlace: (item: DiaryItem) => void;
  onRemove: (id: number) => void;
  onDone: () => void;
  /** 방금 붙인 것. 착 붙는 모습을 한 번 보여준다. */
  fresh: number | null;
};

const press = keyframes`
  0% { transform: scale(1.18); filter: drop-shadow(0 0.75rem 0.75rem rgba(90, 77, 68, 0.25)); }
  70% { transform: scale(0.97); filter: drop-shadow(0 0.125rem 0.125rem rgba(90, 77, 68, 0.2)); }
  100% { transform: scale(1); filter: drop-shadow(0 0.125rem 0.125rem rgba(90, 77, 68, 0.15)); }
`;

function ItemCanvas({ item, images, font, view }: { item: DiaryItem; images: Images; font: string; view: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { width, height } = itemBounds(item, font);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const paint = canvas?.getContext('2d');
    if (!canvas || !paint) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(width * view * ratio);
    canvas.height = Math.ceil(height * view * ratio);
    paint.imageSmoothingEnabled = false;
    paint.setTransform(view * ratio, 0, 0, view * ratio, (width * view * ratio) / 2, (height * view * ratio) / 2);
    drawItem(paint, item, images, font);
  }, [item, images, font, view, width, height]);
  return <canvas ref={ref} style={{ width: width * view, height: height * view, display: 'block' }} />;
}

function Paper({ view }: { view: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const paint = ref.current?.getContext('2d');
    if (paint) drawPaper(paint);
  }, []);
  return (
    <canvas
      ref={ref}
      width={PAGE_PX.width}
      height={PAGE_PX.height}
      style={{ width: PAGE_PX.width * view, height: PAGE_PX.height * view, imageRendering: 'pixelated' }}
      css={css`position: absolute; inset: 0;`}
    />
  );
}

export default function Editor({ page, images, font, onPlace, onRemove, onDone, fresh }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(1);
  const [items, setItems] = useState(page.items);
  const [selected, setSelected] = useState<number | null>(null);
  const gesture = useRef<Gesture | null>(null);

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

  /** 화면 좌표를 페이지 비율 좌표로. 회전과 배율은 비율이라 그대로다. */
  const onPage = (event: PointerEvent | React.PointerEvent): Point => {
    const rect = frame.current?.querySelector('[data-page]')?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const begin = (item: DiaryItem, event: React.PointerEvent) => {
    event.stopPropagation();
    frame.current?.setPointerCapture(event.pointerId);
    setSelected(item.id);
    const point = onPage(event);
    const live = gesture.current?.id === item.id ? gesture.current : null;
    const now = new Map(live?.now ?? []);
    now.set(event.pointerId, point);
    const current = items.find((candidate) => candidate.id === item.id) ?? item;
    /* 잡는 순간 맨 위로 올린다. 다른 스티커 밑에 깔린 채 끌리면 손에 든 느낌이 없다. */
    setItems((all) => bringToFront(all, item.id) as DiaryItem[]);
    gesture.current = { id: item.id, start: current, from: new Map(now), now, moved: live?.moved ?? false };
  };

  const move = (event: React.PointerEvent) => {
    const live = gesture.current;
    if (!live || !live.now.has(event.pointerId)) return;
    live.now.set(event.pointerId, onPage(event));
    const { dx, dy, scale, rotation } = twoFingerTransform([...live.from.values()], [...live.now.values()]);
    if (Math.hypot(dx, dy) > TAP_SLOP || Math.abs(scale - 1) > TAP_SLOP || Math.abs(rotation) > TAP_SLOP) live.moved = true;
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
    gesture.current = null;
    if (placed && live.moved) onPlace(placed);
  };

  const ordered = [...items].sort((a, b) => a.layer - b.layer || a.id - b.id);

  return (
    <div
      ref={frame}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerDown={() => setSelected(null)}
      css={css`
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 3.5rem 1rem 1.5rem;
        background: var(--color-background);
        touch-action: none;
      `}
    >
      <button
        type="button"
        onClick={onDone}
        onPointerDown={(event) => event.stopPropagation()}
        css={css`
          position: absolute;
          top: 0.75rem;
          left: 1rem;
          padding: 0.5rem 1.25rem;
          border: 0;
          border-radius: var(--radius-pill);
          background: var(--color-foreground);
          color: var(--color-background);
          transition: transform var(--duration-fast) var(--ease-out-expo);
          &:active { transform: scale(0.95); }
        `}
      >
        다 했어
      </button>
      <div data-page style={{ width: PAGE_PX.width * view, height: PAGE_PX.height * view }} css={css`position: relative; overflow: visible;`}>
        <Paper view={view} />
        {ordered.map((item) => {
          const lifted = gesture.current?.id === item.id;
          return (
            <div
              key={item.id}
              onPointerDown={(event) => begin(item, event)}
              style={{
                transform: `translate(${item.x * PAGE_PX.width * view}px, ${item.y * PAGE_PX.height * view}px) translate(-50%, -50%) rotate(${item.rotation}rad)`,
              }}
              css={css`position: absolute; left: 0; top: 0;`}
            >
              <div
                css={css`
                  transition: transform var(--duration-fast) var(--ease-out-expo), filter var(--duration-fast) var(--ease-out-expo);
                  transform: scale(${lifted ? 1.05 : 1});
                  filter: drop-shadow(0 ${lifted ? '0.75rem 0.75rem' : '0.125rem 0.125rem'} rgba(90, 77, 68, ${lifted ? 0.25 : 0.15}));
                  animation: ${fresh === item.id ? css`${press} var(--duration-slow) var(--ease-out-expo)` : 'none'};
                  outline: ${selected === item.id ? '0.125rem dashed var(--color-muted)' : 'none'};
                  outline-offset: 0.25rem;
                `}
              >
                <ItemCanvas item={item} images={images} font={font} view={view} />
              </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
