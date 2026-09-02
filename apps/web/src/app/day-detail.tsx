/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useRef, useState } from 'react';
import { requestHaptic } from '@/lib/bridge';
import { snappedIndex } from '@/lib/carousel';
import { monthDayLabel } from '@/lib/entries';
import type { Entry, Sides } from '@/lib/entries';

function Kept({
  entry,
  whose,
  dateKey,
  named,
}: {
  entry: Entry;
  whose: string;
  dateKey: string;
  named: boolean;
}) {
  return (
    <article css={pageStyle}>
      {/* 혼자 담은 날엔 누구 것인지 말할 필요가 없다. 가릴 것이 있을 때만 이름을 단다. */}
      {named && <p css={whoseStyle}>{whose} 담은</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.imageUrl}
        alt={`${monthDayLabel(dateKey)} ${whose} 담은 사진`}
        css={shotStyle}
      />
      <p css={saidStyle}>
        <span css={colorStyle} style={{ background: entry.color }} />
        <span>{entry.memo || `${whose} 담은 색`}</span>
      </p>
    </article>
  );
}

export default function DayDetail({ dateKey, sides }: { dateKey: string; sides: Sides }) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);

  const kept: { entry: Entry; whose: string }[] = [];
  if (sides.mine) kept.push({ entry: sides.mine, whose: '내가' });
  if (sides.theirs) kept.push({ entry: sides.theirs, whose: '상대가' });

  // 넘기는 것은 브라우저의 스크롤 스냅이 한다. 손짓을 직접 읽으면 시트의 세로
  // 스크롤과 판정을 다투게 되고, 한 번 어긋나면 둘 다 씹힌다.
  const onScroll = () => {
    const pager = pagerRef.current;
    if (!pager) return;

    const next = snappedIndex(pager.scrollLeft, pager.clientWidth, kept.length);
    if (next === shown) return;

    setShown(next);
    requestHaptic('selection');
  };

  // behavior 를 직접 넘기지 않는다. 그 옵션은 CSS 를 이겨서
  // prefers-reduced-motion 이어도 넘어가는 모습이 그대로 돈다.
  const goTo = (index: number) => {
    pagerRef.current?.children[index]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
    });
  };

  return (
    <>
      <h2 css={titleStyle}>{monthDayLabel(dateKey)}</h2>

      <div ref={pagerRef} onScroll={onScroll} css={pagerStyle}>
        {kept.map(({ entry, whose }) => (
          <Kept
            key={entry.author}
            entry={entry}
            whose={whose}
            dateKey={dateKey}
            named={kept.length > 1}
          />
        ))}
      </div>

      {kept.length > 1 && (
        <nav css={dotsStyle} aria-label="누구의 기록을 볼지">
          {kept.map(({ entry, whose }, index) => (
            <button
              key={entry.author}
              type="button"
              aria-label={`${whose} 담은 것`}
              aria-current={index === shown}
              onClick={() => goTo(index)}
              css={dotStyle}
              style={{ background: entry.color, opacity: index === shown ? 1 : 0.3 }}
            />
          ))}
        </nav>
      )}
    </>
  );
}

const titleStyle = css`
  margin: 0.5rem 0 1.75rem;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

/* 넘기는 동안 두 사진이 맞붙지 않도록 사이를 벌린다. 페이저를 그 폭만큼 밖으로
   빼고 페이지가 안쪽으로 물리면, 사진은 원래 폭 그대로면서 사이에만 틈이 생긴다.
   스냅 간격은 페이저의 폭 그대로라 몇 번째 장인지 세는 계산은 바뀌지 않는다. */
const pagerStyle = css`
  display: flex;
  margin: 0 -0.375rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const pageStyle = css`
  flex: 0 0 100%;
  padding: 0 0.375rem;
  scroll-snap-align: center;
`;

const whoseStyle = css`
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const shotStyle = css`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-card);
  background: var(--color-faint);
`;

/* 메모는 그 사람이 직접 쓴 말이라 담을 때와 같은 색으로 읽힌다.
   누구 것인지는 곁들이는 정보라 한 단 아래에 둔다. */
const saidStyle = css`
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-foreground);
`;

/* 색 막대가 글줄과 같은 키다. 메모가 여러 줄이 되면 막대도 같이 자란다. */
const colorStyle = css`
  flex: 0 0 auto;
  width: 0.875rem;
  min-height: 1.75rem;
  border-radius: var(--radius-pill);
`;

/* 점이 각자의 색이다. 한 장만 보이는 동안에도 그날의 두 색은 같이 남는다. */
const dotsStyle = css`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const dotStyle = css`
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  transition: opacity var(--duration-fast) linear;

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;
