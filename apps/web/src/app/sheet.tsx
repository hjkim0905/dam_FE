/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { requestHaptic } from '@/lib/bridge';
import { rubberBand, settleDuration, shouldDismiss } from '@/lib/sheet';

const RISE_MS = 320;

type SheetProps = {
  open: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
};

/** 시트는 콘텐츠다. 유리가 아니므로 웹이 그린다 — 크롬만 네이티브가 맡는다. */
export default function Sheet({ open, label, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ from: 0, at: 0, time: 0, speed: 0 });

  const place = useCallback((offset: number, ms?: number) => {
    const panel = panelRef.current;
    if (!panel) return;

    panel.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none';
    panel.style.transform = `translate3d(0, ${offset}px, 0)`;
  }, []);

  // 올라오는 것도 끄는 것과 같은 방식으로 움직인다. CSS 애니메이션으로 띄우면
  // 올라오는 동안 손을 대도 그쪽이 계속 보간해서 손이 깔끔히 넘겨받지 못한다.
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;

    place(panel.offsetHeight);
    const frame = requestAnimationFrame(() => place(0, RISE_MS));
    return () => cancelAnimationFrame(frame);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, onClose]);

  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    // 진행 중인 전환을 그 자리에서 끊어 손이 이어받는다. 끝날 때까지 기다리면 놓친 느낌이 난다.
    const now = panelRef.current?.getBoundingClientRect().top ?? 0;
    const rest = panelRef.current?.offsetTop ?? 0;
    dragRef.current = { from: e.clientY, at: now - rest, time: e.timeStamp, speed: 0 };
    place(now - rest);
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const offset = rubberBand(drag.at + e.clientY - drag.from);
    const elapsed = e.timeStamp - drag.time;
    if (elapsed > 0) drag.speed = (offset - rubberBand(drag.at)) / elapsed;
    place(offset);
  };

  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;

    const drag = dragRef.current;
    const offset = rubberBand(drag.at + e.clientY - drag.from);
    const height = panel.offsetHeight;

    if (shouldDismiss(offset, drag.speed, height)) {
      requestHaptic('light');
      place(height, settleDuration(height - offset, drag.speed));
      onClose();
      return;
    }
    place(0, settleDuration(offset, drag.speed));
  };

  if (!open) return null;

  return (
    <div css={backdropStyle} onPointerDown={onClose} role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
        css={panelStyle}
      >
        <div
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          css={handleStyle}
        >
          <span />
        </div>
        {children}
      </div>
    </div>
  );
}

const backdropStyle = css`
  position: fixed;
  inset: 0;
  /* 양모 테두리(body::before, z-index 10) 위다. 시트는 화면을 통째로 넘겨받는다. */
  z-index: 20;
  display: flex;
  align-items: flex-end;
  background: oklch(from var(--color-foreground) l c h / 0.35);
  animation: dim var(--duration-fast) linear both;

  @keyframes dim {
    from {
      opacity: 0;
    }
  }
`;

/* 위로 한 뼘 남겨 뒤 화면이 비친다. 그래야 덮은 것이지 넘어온 것이 아니다.
   아래 여백에 안전영역을 더하는 이유: 탭바는 시스템이 웹뷰 위에 그리므로
   시트를 끝까지 채워도 그 아래에 깔린다. 콘텐츠가 그만큼 비켜서야 한다. */
const panelStyle = css`
  width: 100%;
  height: calc(100% - var(--inset-top, env(safe-area-inset-top)) - 2.5rem);
  display: flex;
  flex-direction: column;
  padding: 0 var(--space-edge)
    calc(2rem + var(--inset-bottom, env(safe-area-inset-bottom)));
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  background: var(--color-background);
  overflow-y: auto;
  overscroll-behavior: contain;
`;

/* 잡는 자리는 손가락만 하다. 그래버 자체는 작아도 그 둘레가 다 잡힌다. */
const handleStyle = css`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  margin: 0 calc(var(--space-edge) * -1);
  touch-action: none;
  cursor: grab;

  span {
    width: 2.25rem;
    height: 0.3125rem;
    border-radius: var(--radius-pill);
    background: var(--color-faint);
  }

  &:active span {
    background: var(--color-muted);
  }
`;
