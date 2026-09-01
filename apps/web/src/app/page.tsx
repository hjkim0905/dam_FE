/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { requestHaptic, subscribeToNative } from '@/lib/bridge';
import { snappedIndex } from '@/lib/carousel';
import {
  entriesInMonth,
  monthDayLabel,
  monthKeyOf,
  monthLabel,
  toDateKey,
} from '@/lib/entries';
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
    // 방울을 눌러 가운데로 데려오는 길이 부드러워야 해서 스트립이 smooth 다.
    // 오늘로 돌려놓는 건 보이면 안 되므로 이 호출만 즉시로 되돌린다.
    strip.scrollTo({ left: (slots - 1) * pitchOf(), behavior: 'instant' });
    setCentered(slots - 1);
  }, [slots]);

  // 기록은 클라이언트에서 읽으므로 첫 페인트엔 비어 있다. 채워지는 순간 끝으로
  // 보내면 오늘이 가운데 오고, 볼 것이 없던 자리라 튀어 보이지 않는다.
  useEffect(showToday, [showToday]);

  // 탭마다 WebView 가 따로 살아 있어서, 다시 들어와도 떠날 때 그대로다. 멈추는 건
  // 스크롤만이 아니다. 오늘 날짜는 렌더 중에 읽으므로 리렌더가 없으면 자정을 넘겨도
  // 어제에 머문다. 기록을 다시 읽으면 매번 새 배열이라 리렌더가 걸리고, 그 김에
  // 오늘이 다시 계산되어 빈 자리가 생긴다. 나중에 상대의 기록이 들어오는 길이기도 하다.
  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type !== 'FOCUS') return;
        setEntries(loadEntries());
        showToday();
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
          {monthLabel(today)}의 색
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
          scroll-behavior: smooth;
          scrollbar-width: none;

          &::-webkit-scrollbar {
            display: none;
          }
        `}
      >
        {thisMonth.map((entry, index) => (
          <button
            key={entry.date}
            type="button"
            aria-label={`${monthDayLabel(entry.date)}의 색`}
            onClick={(e) =>
              e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest' })
            }
            css={dropStyle}
            style={
              {
                '--drop-color': entry.color,
                '--drop-scale': index === centered ? 1 : 0.88,
              } as CSSProperties
            }
          />
        ))}

        {!capturedToday && (
          <Link
            href="/record"
            aria-label="오늘의 색 담기"
            css={[slotStyle, emptySlotStyle]}
            style={
              { '--drop-scale': centered === slots - 1 ? 1 : 0.88 } as CSSProperties
            }
          />
        )}
      </section>
    </main>
  );
}

/* 가운데로 오는 확대와 눌림이 같은 transform 을 나눠 쓰므로, 자리 크기는 변수로
   받고 눌림은 거기에 곱한다. 인라인 style 로 크기를 주면 :active 가 밀려난다. */
const slotStyle = css`
  position: relative;
  flex: 0 0 auto;
  width: ${DROP_WIDTH_REM}rem;
  height: 14rem;
  padding: 0;
  border: none;
  background: none;
  border-radius: var(--radius-pill);
  scroll-snap-align: center;
  transform: scale(var(--drop-scale, 1));
  transition: transform var(--duration-fast) var(--ease-out-expo);

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.4rem;
  }

  @media (hover: hover) {
    &:hover {
      transform: scale(calc(var(--drop-scale, 1) * 1.02));
    }
  }

  &:active {
    transform: scale(calc(var(--drop-scale, 1) * 0.95));
  }
`;

const emptySlotStyle = css`
  display: block;
  border: 0.125rem dashed var(--color-faint);
  transition: transform var(--duration-fast) var(--ease-out-expo),
    border-color var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover {
      border-color: var(--color-muted);
    }
  }

  &:active {
    border-color: var(--color-foreground);
  }
`;

/* 광택은 CSS 그라데이션으로 흉내내면 매끄러워서 오히려 가짜 티가 난다. 회색조 렌더
   한 장을 hard-light 로 얹으면 진짜 음영이 그대로 오고 색은 기록마다 달라진다.
   렌더의 알약 안쪽 평균 밝기를 128 로 맞춰 두었기 때문에 색이 뜨지도 죽지도 않는다. */
const dropStyle = css`
  ${slotStyle};
  background: var(--drop-color);
  box-shadow: 0 0.6rem 1.1rem -0.4rem
    oklch(from var(--drop-color) calc(l - 0.25) calc(c * 0.9) h / 0.45);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/capsule-shade.png') center / 100% 100% no-repeat;
    mix-blend-mode: hard-light;
  }
`;
