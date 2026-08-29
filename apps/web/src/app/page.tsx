/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useRef, useState } from 'react';
import { requestHaptic } from '@/lib/bridge';
import { snappedIndex } from '@/lib/carousel';

const DEMO_COLORS = [
  '#8a9a7b',
  '#c98d6b',
  '#5f7d95',
  '#d4b483',
  '#7d6b8a',
  '#a86b6b',
  '#6b8a80',
  '#9a8a6b',
  '#6b7d9a',
  '#b39a7d',
  '#7b8a6b',
  '#95755f',
  '#5f8a95',
  '#8a6b7d',
  '#a89a6b',
  '#6b9a8a',
  '#9a6b6b',
  '#7d9a6b',
];

const DROP_WIDTH_REM = 4;
const DROP_GAP_REM = 0.5;

// 오늘 방울의 앵커. 웹뷰가 이 해시로 열면 브라우저가 첫 페인트에 스크롤을 맞춰 준다.
// JS 로 옮기면 하이드레이션 뒤에나 돌아서 첫 방울이 보였다가 튄다.
const TODAY_ANCHOR = 'today';

export default function Home() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState(DEMO_COLORS.length - 1);

  const pitchOf = () =>
    (DROP_WIDTH_REM + DROP_GAP_REM) *
    parseFloat(getComputedStyle(document.documentElement).fontSize);

  const onScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;

    const next = snappedIndex(strip.scrollLeft, pitchOf(), DEMO_COLORS.length);

    if (next === centered) return;
    setCentered(next);
    requestHaptic('selection');
  };

  return (
    <main
      css={css`
        position: relative;
        display: flex;
        height: 100%;
        flex-direction: column;
      `}
    >
      <header
        css={css`
          position: absolute;
          top: 3rem;
          left: var(--space-edge);
        `}
      >
        <h1
          css={css`
            margin: 0;
            font-size: 1.75rem;
            font-weight: 600;
            letter-spacing: -0.02em;
          `}
        >
          8월의 색
        </h1>
        <p
          css={css`
            margin: 0.35rem 0 0;
            font-size: 0.875rem;
            color: var(--color-muted);
          `}
        >
          {DEMO_COLORS.length}방울 · {centered + 1}번째
        </p>
      </header>

      <section
        ref={stripRef}
        onScroll={onScroll}
        css={css`
          display: flex;
          flex: 1;
          align-items: center;
          gap: ${DROP_GAP_REM}rem;
          padding: 0 calc(50vw - ${DROP_WIDTH_REM / 2}rem);
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;

          &::-webkit-scrollbar {
            display: none;
          }
        `}
      >
        {DEMO_COLORS.map((color, index) => (
          <div
            key={color}
            id={index === DEMO_COLORS.length - 1 ? TODAY_ANCHOR : undefined}
            css={css`
              flex: 0 0 auto;
              width: ${DROP_WIDTH_REM}rem;
              height: 14rem;
              border-radius: 999rem;
              scroll-snap-align: center;
              /* 앵커로 스크롤될 때 좌우에 이만큼 여백을 확보하게 해서 가운데로 오게 한다. */
              scroll-margin-inline: calc(50vw - ${DROP_WIDTH_REM / 2}rem);
              transition: transform var(--duration-fast) var(--ease-out-expo);
            `}
            style={{
              backgroundColor: color,
              transform: `scale(${index === centered ? 1 : 0.88})`,
            }}
          />
        ))}
      </section>
    </main>
  );
}
