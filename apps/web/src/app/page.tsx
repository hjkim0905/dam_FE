/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { requestHaptic, subscribeToNative } from '@/lib/bridge';
import { snappedIndex } from '@/lib/carousel';
import { entriesInMonth, monthKeyOf, toDateKey } from '@/lib/entries';
import type { Entry } from '@/lib/entries';
import { loadEntries } from '@/lib/entry-store';

const DROP_WIDTH_REM = 4;
const DROP_GAP_REM = 0.5;

export default function Home() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [centered, setCentered] = useState(0);

  useEffect(() => setEntries(loadEntries()), []);

  const today = toDateKey(new Date());
  const thisMonth = entriesInMonth(entries, monthKeyOf(today));
  const capturedToday = thisMonth.some((e) => e.date === today);
  const slots = capturedToday ? thisMonth.length : thisMonth.length + 1;

  const showToday = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || slots === 0) return;
    strip.scrollLeft = (slots - 1) * pitchOf();
    setCentered(slots - 1);
  }, [slots]);

  // 기록은 클라이언트에서 읽으므로 첫 페인트엔 비어 있다. 채워지는 순간 끝으로
  // 보내면 오늘이 가운데 오고, 볼 것이 없던 자리라 튀어 보이지 않는다.
  useEffect(showToday, [showToday]);

  // 탭마다 WebView 가 따로 살아 있어서 다른 탭에 다녀와도 스크롤이 그대로 남는다.
  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type === 'FOCUS') showToday();
      }),
    [showToday]
  );

  const pitchOf = () =>
    (DROP_WIDTH_REM + DROP_GAP_REM) *
    parseFloat(getComputedStyle(document.documentElement).fontSize);

  const onScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const next = snappedIndex(strip.scrollLeft, pitchOf(), slots);
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
          top: 4.5rem;
          left: var(--space-edge);
        `}
      >
        <h1
          css={css`
            margin: 0;
            font-size: 1.75rem;
            font-weight: 400;
            letter-spacing: -0.02em;
          `}
        >
          {new Date().getMonth() + 1}월의 색
        </h1>
        <p
          css={css`
            margin: 0.35rem 0 0;
            font-size: 0.875rem;
            color: var(--color-muted);
          `}
        >
          {thisMonth.length}방울의 기록
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
        {thisMonth.map((entry, index) => (
          <div
            key={entry.date}
            css={dropStyle}
            style={{
              backgroundColor: entry.color,
              transform: `scale(${index === centered ? 1 : 0.88})`,
            }}
          />
        ))}

        {!capturedToday && (
          <Link
            href="/record"
            aria-label="오늘의 색 담기"
            css={[
              dropStyle,
              css`
                display: block;
                border: 0.125rem dashed var(--color-faint);

                &:active {
                  border-color: var(--color-muted);
                }
              `,
            ]}
            style={{ transform: `scale(${centered === slots - 1 ? 1 : 0.88})` }}
          />
        )}
      </section>
    </main>
  );
}

const dropStyle = css`
  flex: 0 0 auto;
  width: ${DROP_WIDTH_REM}rem;
  height: 14rem;
  border-radius: var(--radius-pill);
  scroll-snap-align: center;
  transition: transform var(--duration-fast) var(--ease-out-expo);
`;
