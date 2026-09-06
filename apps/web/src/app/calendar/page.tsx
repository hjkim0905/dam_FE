/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { monthCells } from '@/lib/calendar';
import {
  monthDayLabel,
  monthKeyOf,
  monthRange,
  monthTitle,
  sidesOn,
  toDateKey,
  viewOf,
  yearsSince,
} from '@/lib/entries';
import type { Company, Entry, Sides } from '@/lib/entries';
import { fetchEntries } from '@/lib/api/entries';
import { useSession } from '../session';
import DayDetail from '../day-detail';
import CompanyFilter from '../company-filter';
import MonthWheel from '../month-wheel';
import Sheet from '../sheet';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function Day({
  dateKey,
  sides,
  onOpen,
}: {
  dateKey: string;
  sides: Sides;
  onOpen: (dateKey: string) => void;
}) {
  const shots = [sides.mine, sides.theirs].filter((e): e is Entry => e !== null);
  const label = monthDayLabel(dateKey);

  // 담지 않은 날은 열 것이 없다. 빈 버튼을 두면 눌러도 아무 일이 없다.
  const Cell = shots.length > 0 ? 'button' : 'div';

  return (
    <Cell
      css={[cellStyle, shots.length > 0 && openableStyle]}
      {...(shots.length > 0
        ? { type: 'button' as const, 'aria-label': `${label} 기록 보기`, onClick: () => onOpen(dateKey) }
        : {})}
    >
      <div css={slotStyle}>
        {shots.length > 0 && (
          <div css={shotsStyle}>
            {shots.map((entry) => (
              <img
                key={entry.author}
                src={entry.imageUrl}
                alt={`${label} ${entry === sides.mine ? '내' : '상대'} 사진`}
              />
            ))}
          </div>
        )}
        {shots.length > 0 && (
          <span
            css={markStyle}
            style={
              {
                '--left': (sides.mine ?? sides.theirs)?.color,
                '--right': (sides.theirs ?? sides.mine)?.color,
              } as CSSProperties
            }
          />
        )}
      </div>
      <small css={[numberStyle, shots.length > 0 && filledNumberStyle]}>
        {Number(dateKey.slice(8))}
      </small>
    </Cell>
  );
}
import useFocusReload from '../use-focus-reload';

export default function CalendarScreen() {
  // 홈과 같은 이유로 '아직 모른다' 를 빈 배열과 구분한다. 빈 배열로 두면 첫 페인트에
  // 사진 없는 달이 그려졌다가 채워지고, 필터가 뒤늦게 생기며 격자가 아래로 밀린다.
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [view, setView] = useState<Company>('both');
  const [openDate, setOpenDate] = useState<string | null>(null);
  // 고른 달이 없으면 이번 달이다. 상태로 두어야 휠이 바꿀 자리가 생긴다.
  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const [pickingMonth, setPickingMonth] = useState(false);
  const { profile, me, refresh } = useSession();

  const monthKey = chosenMonth ?? monthKeyOf(toDateKey(new Date()));
  // 방이 없으면 고를 것이 하나뿐이라 필터를 감춘다. 그때는 서버도 내것만 준다.
  const together = profile.room !== null && profile.room.partner !== null;

  const load = useCallback(() => {
    let live = true;
    fetchEntries(monthRange(monthKey), viewOf(together ? view : 'mine'))
      .then((found) => { if (live) setEntries(found); })
      .catch(() => { if (live) setEntries([]); });
    return () => { live = false; };
  }, [monthKey, view, together]);

  useEffect(load, [load]);

  useFocusReload(load, refresh);

  const shown = entries ?? [];

  return (
    <main css={screenStyle}>
      <button
        type="button"
        onClick={() => setPickingMonth(true)}
        aria-label={`${monthTitle(monthKey)}, 다른 달 고르기`}
        css={titleStyle}
      >
        {monthTitle(monthKey)}
        <span css={chevronStyle} aria-hidden>
          ▼
        </span>
      </button>

      {entries === null ? null : (
        <>
          {together && <CompanyFilter view={view} onChange={setView} />}

          <div css={weekdayStyle} aria-hidden>
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div css={gridStyle}>
            {monthCells(monthKey).map((dateKey, index) =>
              dateKey ? (
                <Day
                key={dateKey}
                dateKey={dateKey}
                sides={sidesOn(shown, dateKey, me)}
                onOpen={setOpenDate}
              />
              ) : (
                // 1일 앞의 빈 자리. 날짜가 없으니 키로 쓸 것도 자리 순서뿐이다.
                // eslint-disable-next-line react/no-array-index-key
                <div key={`lead-${index}`} />
              )
            )}
          </div>
        </>
      )}

      <Sheet
        open={pickingMonth}
        label="년월 고르기"
        fill={false}
        onClose={() => setPickingMonth(false)}
      >
        <MonthWheel
          years={yearsSince(profile.firstKeptDate, Number(monthKey.slice(0, 4)))}
          monthKey={monthKey}
          onChange={setChosenMonth}
        />
      </Sheet>

      <Sheet
        open={openDate !== null}
        label={openDate ? `${monthDayLabel(openDate)} 기록` : ''}
        onClose={() => setOpenDate(null)}
      >
        {openDate && <DayDetail dateKey={openDate} sides={sidesOn(shown, openDate, me)} />}
      </Sheet>
    </main>
  );
}

const screenStyle = css`
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 4.5rem var(--space-edge) 0;
`;

/* iOS 는 누를 수 있는 글자를 틴트 색으로 칠하지만, 여기서는 기록한 색이 유일한 색이라
   그 수단이 없다. 대신 같은 폰트의 글자를 쓴다 — 갈무리에 ▾ 는 없고 ▼ 는 있어서,
   ▾ 를 쓰면 시스템 폰트로 떨어져 픽셀 글자 옆에 매끈한 삼각형이 붙는다. */
const chevronStyle = css`
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const titleStyle = css`
  display: flex;
  align-items: baseline;
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 1.75rem;
  letter-spacing: -0.02em;
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

const weekdayStyle = css`
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 0.1875rem;
  margin: 1rem 0 0.375rem;

  span {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-foreground);
  }
`;

/* 여섯 주를 고정으로 잡아 둔다. 달마다 주 수가 달라도 격자 높이가 그대로라
   달을 넘길 때 화면이 출렁이지 않는다. 남는 높이는 사진이 나눠 갖는다. */
const gridStyle = css`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  column-gap: 0.1875rem;
  row-gap: 0.5625rem;
  padding-bottom: 0.5rem;
`;

const cellStyle = css`
  display: flex;
  min-height: 0;
  flex-direction: column;
  align-items: center;
`;

/* 담지 않은 날도 같은 높이의 자리를 갖는다. 그래야 날짜가 한 기준선에 선다. */
const slotStyle = css`
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
`;

/* 모서리는 감싸는 쪽이 잘라낸다. 사진마다 반경을 주면 반쪽일 때 어느 모서리를
   죽일지 매번 정해야 하고, 한 번 어긋나면 각진 칸이 남는다. */
const shotsStyle = css`
  position: absolute;
  inset: 0;
  display: flex;
  border-radius: var(--radius-thumb);
  overflow: hidden;

  img {
    flex: 1;
    min-width: 0;
    height: 100%;
    object-fit: cover;
  }
`;

/* 사진 색이 무엇이든 원이 묻히지 않게 배경색 테두리를 두른다. 사진을 덮지 않으려고
   모서리 밖으로 걸치므로 잘라내는 shots 안에 둘 수 없다. */
const markStyle = css`
  position: absolute;
  top: -0.1875rem;
  right: -0.1875rem;
  width: 0.875rem;
  height: 0.875rem;
  border: 0.125rem solid var(--color-background);
  border-radius: var(--radius-pill);
  background: linear-gradient(
    90deg,
    var(--left) 0 50%,
    var(--right) 50% 100%
  );
`;

/* 담지 않은 날이 흐린 쪽이다. 다만 --color-faint 까지 내리지는 않는다.
   면과 선에 쓰는 색이라 글자로 놓으면 대비가 1.4:1 이라 읽히지 않는다. */
const numberStyle = css`
  flex: 0 0 auto;
  margin-top: 0.3125rem;
  font-size: 0.875rem;
  line-height: 1.125rem;
  color: var(--color-muted);
`;

const filledNumberStyle = css`
  color: var(--color-foreground);
`;

const openableStyle = css`
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out-expo);

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
    border-radius: var(--radius-thumb);
  }
`;
