/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { subscribeToNative } from '@/lib/bridge';
import {
  bandOf,
  entriesFrom,
  entriesInYear,
  hasCompany,
  toDateKey,
  yearsOf,
} from '@/lib/entries';
import type { Company, Entry } from '@/lib/entries';
import { loadEntries } from '@/lib/entry-store';
import CompanyFilter from '../company-filter';
import Sheet from '../sheet';
import YearWheel from '../year-wheel';

export default function Flow() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [view, setView] = useState<Company>('both');
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [pickingYear, setPickingYear] = useState(false);

  useEffect(() => setEntries(loadEntries()), []);

  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type === 'FOCUS') setEntries(loadEntries());
      }),
    []
  );

  const year = chosenYear ?? Number(toDateKey(new Date()).slice(0, 4));
  const together = hasCompany(entries ?? []);
  const shown = entriesInYear(entriesFrom(entries ?? [], together ? view : 'both'), year);

  return (
    <main css={screenStyle}>
      <h1 css={headingStyle}>
        <button
          type="button"
          onClick={() => setPickingYear(true)}
          aria-label={`${year}년의 흐름, 다른 해 고르기`}
          css={titleStyle}
        >
          {year}년의 흐름
          <span css={chevronStyle} aria-hidden>
            ▼
          </span>
        </button>
      </h1>

      {entries === null ? null : (
        <>
          {together && <CompanyFilter view={view} onChange={setView} />}

          <div css={stageStyle}>
            {/* 하루가 방울 하나라면 한 해는 방울 하나다. 같은 모양에 같은 양모 음영을
                얹어 규모만 커지게 한다 — 새로 배울 시각 언어가 없다. */}
            <div
              css={[dropStyle, shown.length === 0 && emptyDropStyle]}
              style={{ background: bandOf(shown.map((e) => e.color)) }}
              aria-label={`${year}년에 담은 ${shown.length}가지 색`}
              role="img"
            />
          </div>

          <p css={countStyle}>
            {shown.length === 0 ? '아직 담은 색이 없어요' : `${shown.length}가지 색`}
          </p>
        </>
      )}

      <Sheet
        open={pickingYear}
        label="해 고르기"
        fill={false}
        onClose={() => setPickingYear(false)}
      >
        <YearWheel
          years={yearsOf(entries ?? [], year)}
          year={year}
          onChange={setChosenYear}
        />
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

const stageStyle = css`
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
`;

/* 방울과 같은 비율(2:7)이라 음영 렌더가 늘어나지 않는다. 높이를 남는 자리에 맡기고
   폭은 비율이 정한다 — 기기가 짧으면 방울도 같이 줄어든다. */
const dropStyle = css`
  height: 100%;
  aspect-ratio: 2 / 7;
  position: relative;
  border-radius: var(--radius-pill);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/capsule-shade.png') center / 100% 100% no-repeat;
    mix-blend-mode: hard-light;
  }
`;

const emptyDropStyle = css`
  background: none;
  border: 0.125rem dashed var(--color-faint);

  &::before {
    content: none;
  }
`;

const countStyle = css`
  margin: 0 0 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-muted);
`;
