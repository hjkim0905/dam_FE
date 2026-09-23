/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useQueryClient } from '@tanstack/react-query';
import { strings } from '@/lib/i18n';
import { ENTRIES } from '@/lib/query-keys';
import { useCallback, useState } from 'react';
import { bandOf, toDateKey, viewOf, yearRange, yearsSince } from '@/lib/entries';
import type { Company } from '@/lib/entries';
import { useSession } from '../session';
import useEntries from '../use-entries';
import LoadFailed from '../load-failed';
import CompanyFilter from '../company-filter';
import Sheet from '../sheet';
import YearWheel from '../year-wheel';
import useFocusReload from '../use-focus-reload';

export default function Flow() {
  const [view, setView] = useState<Company>('both');
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [pickingYear, setPickingYear] = useState(false);
  const { profile, refresh } = useSession();
  const client = useQueryClient();
  const s = strings();

  const year = chosenYear ?? Number(toDateKey(new Date()).slice(0, 4));
  const together = profile.room !== null && profile.room.partner !== null;

  const { entries, failed } = useEntries(
    yearRange(year),
    viewOf(together ? view : 'mine')
  );

  /* 탭에 들어온 사이 상대가 담았을 수 있다. 캐시를 버려야 다시 받는다. */
  const reload = useCallback(
    () => void client.invalidateQueries({ queryKey: ENTRIES }),
    [client]
  );

  useFocusReload(reload, refresh);

  const shown = entries ?? [];

  return (
    <main css={screenStyle}>
      <h1 css={headingStyle}>
        <button
          type="button"
          onClick={() => setPickingYear(true)}
          aria-label={s.flowAria(year)}
          css={titleStyle}
        >
          {s.flowTitle(year)}
          <span css={chevronStyle} aria-hidden>
            ▼
          </span>
        </button>
      </h1>

      {failed ? <LoadFailed onRetry={reload} /> : entries === null ? null : (
        <>
          {together && <CompanyFilter view={view} onChange={setView} />}

          <div css={stageStyle}>
            {/* 하루가 방울 하나라면 한 해는 방울 하나다. 같은 모양에 같은 양모 음영을
                얹어 규모만 커지게 한다 — 새로 배울 시각 언어가 없다. */}
            <div
              css={[dropStyle, shown.length === 0 && emptyDropStyle]}
              style={{ background: bandOf(shown.map((e) => e.color)) }}
              aria-label={s.colorsKeptAria(year, shown.length)}
              role="img"
            />
          </div>

          <p css={countStyle}>
            {shown.length === 0 ? s.nothingKept : s.colorsKept(shown.length)}
          </p>
        </>
      )}

      <Sheet
        open={pickingYear}
        label={s.pickYear}
        fill={false}
        onClose={() => setPickingYear(false)}
      >
        <YearWheel
          years={yearsSince(profile.firstKeptDate, year)}
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

/* 방울을 눕힌 비율(7:2)이라 음영 렌더가 늘어나지 않는다. 그 렌더는 세로 방울용을
   시계 방향으로 돌린 것이라 밝은 쪽이 위로 온다 — 누운 알약도 빛을 위에서 받는다. */
const dropStyle = css`
  position: relative;
  width: 100%;
  aspect-ratio: 7 / 2;
  border-radius: var(--radius-pill);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/capsule-shade-wide.png') center / 100% 100% no-repeat;
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
