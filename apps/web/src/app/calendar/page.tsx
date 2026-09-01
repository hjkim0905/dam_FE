/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { subscribeToNative } from '@/lib/bridge';
import { monthCells } from '@/lib/calendar';
import {
  entriesFrom,
  hasCompany,
  monthDayLabel,
  monthKeyOf,
  monthTitle,
  sidesOn,
  toDateKey,
} from '@/lib/entries';
import type { Company, Entry, Sides } from '@/lib/entries';
import { loadEntries } from '@/lib/entry-store';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const VIEWS: { value: Company; label: string }[] = [
  { value: 'mine', label: '내것' },
  { value: 'both', label: '함께' },
  { value: 'theirs', label: '상대것' },
];

function Day({ dateKey, sides }: { dateKey: string; sides: Sides }) {
  const shots = [sides.mine, sides.theirs].filter((e): e is Entry => e !== null);
  const label = monthDayLabel(dateKey);

  return (
    <div css={cellStyle}>
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
    </div>
  );
}

export default function CalendarScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<Company>('both');

  useEffect(() => setEntries(loadEntries()), []);

  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type === 'FOCUS') setEntries(loadEntries());
      }),
    []
  );

  const monthKey = monthKeyOf(toDateKey(new Date()));
  const together = hasCompany(entries);
  const shown = entriesFrom(entries, together ? view : 'both');

  return (
    <main css={screenStyle}>
      <h1 css={titleStyle}>{monthTitle(monthKey)}</h1>

      {together && (
        <nav css={segmentStyle} aria-label="누구의 기록을 볼지">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              css={[choiceStyle, view === value && chosenStyle]}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      <div css={weekdayStyle} aria-hidden>
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div css={gridStyle}>
        {monthCells(monthKey).map((dateKey, index) =>
          dateKey ? (
            <Day key={dateKey} dateKey={dateKey} sides={sidesOn(shown, dateKey)} />
          ) : (
            // 1일 앞의 빈 자리. 날짜가 없으니 키로 쓸 것도 자리 순서뿐이다.
            // eslint-disable-next-line react/no-array-index-key
            <div key={`lead-${index}`} />
          )
        )}
      </div>
    </main>
  );
}

const screenStyle = css`
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 4.5rem var(--space-edge) 0;
`;

const titleStyle = css`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const segmentStyle = css`
  display: flex;
  flex: 0 0 auto;
  margin-top: 1rem;
  border: 0.0625rem solid var(--color-faint);
  border-radius: var(--radius-pill);
  overflow: hidden;
`;

const choiceStyle = css`
  flex: 1;
  padding: 0.5rem 0;
  border: none;
  background: none;
  color: var(--color-muted);
  font: inherit;
  font-size: 0.875rem;
  /* 배경은 전환하지 않는다. 눌린 순간의 표시가 늦게 따라오면 손가락보다 굼떠 보인다.
     글자색만 넘어가는 이유는 색 램프라 곡선을 주면 오히려 늘어져 보이기 때문이다. */
  transition: color var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover {
      color: var(--color-foreground);
    }
  }

  &:active {
    background: var(--color-faint);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: -0.25rem;
  }
`;

const chosenStyle = css`
  background: var(--color-foreground);
  color: var(--color-background);
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
