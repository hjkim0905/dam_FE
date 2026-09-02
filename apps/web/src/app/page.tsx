/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { openOutside, requestHaptic, subscribeToNative } from '@/lib/bridge';
import { snappedIndex, stripSlots } from '@/lib/carousel';
import {
  entriesFrom,
  sidesOn,
  entriesInMonth,
  monthDayLabel,
  monthKeyOf,
  monthLabel,
  monthTitle,
  toDateKey,
  yearsOf,
} from '@/lib/entries';
import type { Entry } from '@/lib/entries';
import { loadEntries } from '@/lib/entry-store';
import { forgetEverything } from '@/lib/profile-store';
import ConfirmSheet from './confirm-sheet';
import DayDetail from './day-detail';
import MeSheet from './me-sheet';
import MonthWheel from './month-wheel';
import RoomSheet from './room-sheet';
import Sheet from './sheet';

type MenuAction = 'me' | 'room' | 'privacy' | 'terms' | 'contact' | 'signOut' | 'deleteAccount';

/* 앱 밖 문서라 웹뷰가 아니라 사파리로 나간다. 주소가 바뀌면 여기만 고친다. */
const DOCUMENTS: Record<'privacy' | 'terms' | 'contact', string> = {
  privacy: 'https://www.notion.so/dam-privacy',
  terms: 'https://www.notion.so/dam-terms',
  contact: 'https://www.notion.so/dam-contact',
};

const DROP_WIDTH_REM = 4;
const DROP_GAP_REM = 0.5;

/* 자리를 잡는 일은 그려지기 전에 끝나야 한다. useEffect 는 페인트 뒤라 옮기는 게
   눈에 보인다. 서버에는 레이아웃이 없으므로 그쪽에서는 평범한 effect 로 둔다. */
const useBeforePaint =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function Home() {
  const stripRef = useRef<HTMLDivElement>(null);
  // 읽기 전에는 빈 배열이 아니라 '아직 모른다' 여야 한다. 빈 배열로 두면 첫 페인트에
  // 기록이 하나도 없는 화면이 그려졌다가 채워져서, 빈 자리가 떴다 사라진다.
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [centered, setCentered] = useState(0);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const [pickingMonth, setPickingMonth] = useState(false);
  const [opened, setOpened] = useState<MenuAction | null>(null);

  useEffect(() => setEntries(loadEntries()), []);

  const today = toDateKey(new Date());
  const monthKey = chosenMonth ?? monthKeyOf(today);
  // 지난 달엔 담을 자리가 없다. 오늘은 이번 달을 보고 있을 때만 자리를 갖는다.
  const todayHere = monthKey === monthKeyOf(today) ? today : null;

  // 홈은 내가 담은 것만 보여준다. 방은 달력과 흐름에서 열린다.
  const thisMonth = entriesInMonth(entriesFrom(entries ?? [], 'mine'), monthKey);
  const capturedToday = todayHere !== null && thisMonth.some((e) => e.date === today);
  const { slots, todayIndex } = stripSlots(
    thisMonth.map((e) => e.date),
    capturedToday ? today : todayHere
  );

  const showToday = useCallback(() => {
    const strip = stripRef.current;
    const target = strip?.children[todayIndex];
    if (!strip || !target) return;

    // 좌표로 계산하면 방울 너비·루트 폰트 크기·좌우 패딩이 전부 예상대로여야 맞는다.
    // 스트립의 smooth 는 방울을 눌러 데려올 때의 것이라, 돌려놓을 때만 끈다.
    strip.style.scrollBehavior = 'auto';
    target.scrollIntoView({ inline: 'center', block: 'nearest' });
    strip.style.scrollBehavior = '';
    setCentered(todayIndex);
  }, [slots, todayIndex]);

  // 기록은 클라이언트에서 읽으므로 첫 페인트엔 비어 있다. 채워지는 순간 오늘로
  // 보내면 볼 것이 없던 자리라 튀어 보이지 않는다.
  //
  // 다음 프레임에 한 번 더 부르는 이유: 스냅 컨테이너는 자식이 늘어나면 레이아웃 뒤에
  // 스냅을 다시 잡는데, 그때 방금 옮겨둔 자리가 첫 칸으로 되돌아가는 엔진이 있다.
  useBeforePaint(() => {
    showToday();
    const frame = requestAnimationFrame(showToday);
    return () => cancelAnimationFrame(frame);
  }, [showToday]);

  // 탭마다 WebView 가 따로 살아 있어서, 다시 들어와도 떠날 때 그대로다. 멈추는 건
  // 스크롤만이 아니다. 오늘 날짜는 렌더 중에 읽으므로 리렌더가 없으면 자정을 넘겨도
  // 어제에 머문다. 기록을 다시 읽으면 매번 새 배열이라 리렌더가 걸리고, 그 김에
  // 오늘이 다시 계산되어 빈 자리가 생긴다. 나중에 상대의 기록이 들어오는 길이기도 하다.
  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type === 'MENU') {
          const { action } = (message.payload ?? {}) as { action?: MenuAction };
          if (action && action in DOCUMENTS) openOutside(DOCUMENTS[action as keyof typeof DOCUMENTS]);
          else if (action) setOpened(action);
          return;
        }
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
        <h1 css={headingStyle}>
          <button
            type="button"
            onClick={() => setPickingMonth(true)}
            aria-label={`${monthTitle(monthKey)}, 다른 달 고르기`}
            css={titleStyle}
          >
          {monthLabel(monthKey)}의 색
          <span css={chevronStyle} aria-hidden>
            ▼
          </span>
          </button>
        </h1>
        <p
          css={css`
            margin: 0.35rem 0 0;
            font-size: 0.875rem;
            color: var(--color-muted);
          `}
        >
          {entries === null ? '\u00a0' : `${thisMonth.length}방울의 기록`}
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
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;

          /* 첫 방울과 마지막 방울도 가운데 설 수 있으려면 양끝에 화면 절반만큼의
             여백이 있어야 한다. 패딩으로 주면 WebKit 이 끝쪽 패딩을 scrollWidth 에
             넣지 않아 넘치는 폭이 사라지고 스트립이 아예 스크롤되지 않는다.
             자리를 차지하는 요소로 두면 그 계산에 반드시 들어간다.
             gap 이 이 요소에도 걸리므로 그만큼 빼야 방울이 정확히 가운데 선다. */
          &::before,
          &::after {
            content: '';
            flex: 0 0 calc(
              50vw - ${DROP_WIDTH_REM / 2}rem - ${DROP_GAP_REM}rem
            );
          }

          &::-webkit-scrollbar {
            display: none;
          }
        `}
      >
        {entries !== null &&
          thisMonth.map((entry, index) => (
          <button
            key={entry.date}
            type="button"
            aria-label={`${monthDayLabel(entry.date)}의 색`}
            // 멀리 있는 방울은 먼저 데려온다. 이미 와 있으면 그날을 연다.
            onClick={(e) => {
              if (index === centered) setOpenDate(entry.date);
              else e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest' });
            }}
            css={dropStyle}
            style={
              {
                '--drop-color': entry.color,
                '--drop-scale': index === centered ? 1 : 0.88,
              } as CSSProperties
            }
          />
          ))}

        {entries !== null && !capturedToday && (
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

      <MeSheet
        open={opened === 'me'}
        entries={entries ?? []}
        onClose={() => setOpened(null)}
      />

      <RoomSheet
        open={opened === 'room'}
        entries={entries ?? []}
        onClose={() => setOpened(null)}
      />

      <ConfirmSheet
        open={opened === 'signOut'}
        title="로그아웃"
        detail="담은 기록은 이 기기에 그대로 남아요. 계정이 생기기 전이라 아직 나갈 곳이 없어요."
        confirm="알겠어요"
        onConfirm={() => setOpened(null)}
        onClose={() => setOpened(null)}
      />

      <ConfirmSheet
        open={opened === 'deleteAccount'}
        title="회원탈퇴"
        detail="지금까지 담은 색과 사진, 메모가 모두 지워져요. 되돌릴 수 없어요."
        confirm="모두 지우기"
        destructive
        onConfirm={() => {
          forgetEverything();
          setEntries([]);
          setOpened(null);
        }}
        onClose={() => setOpened(null)}
      />

      <Sheet
        open={pickingMonth}
        label="년월 고르기"
        fill={false}
        onClose={() => setPickingMonth(false)}
      >
        <MonthWheel
          years={yearsOf(entries ?? [], Number(monthKey.slice(0, 4)))}
          monthKey={monthKey}
          onChange={setChosenMonth}
        />
      </Sheet>

      <Sheet
        open={openDate !== null}
        label={openDate ? `${monthDayLabel(openDate)} 기록` : ''}
        onClose={() => setOpenDate(null)}
      >
        {/* 홈은 내 것만 보는 자리다. 상대의 그날은 달력에서 함께 본다. */}
        {openDate && <DayDetail dateKey={openDate} sides={sidesOn(thisMonth, openDate)} />}
      </Sheet>
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

const headingStyle = css`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const titleStyle = css`
  display: flex;
  align-items: baseline;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: opacity var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover {
      opacity: 0.7;
    }
  }

  &:active {
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;

/* iOS 는 누를 수 있는 글자를 틴트 색으로 칠하지만, 여기서는 기록한 색이 유일한 색이라
   그 수단이 없다. 대신 같은 폰트의 글자를 쓴다 — 갈무리에 ▾ 는 없고 ▼ 는 있어서,
   ▾ 를 쓰면 시스템 폰트로 떨어져 픽셀 글자 옆에 매끈한 삼각형이 붙는다. */
const chevronStyle = css`
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-muted);
`;
