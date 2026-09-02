/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { monthDayLabel } from '@/lib/entries';
import type { Entry, Sides } from '@/lib/entries';

function Kept({ entry, whose }: { entry: Entry; whose: string }) {
  return (
    <section css={keptStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={entry.imageUrl} alt={`${whose} 담은 사진`} css={shotStyle} />
      <p css={lineStyle}>
        <span css={colorStyle} style={{ background: entry.color }} />
        <span>{entry.memo || `${whose} 담은 색`}</span>
      </p>
    </section>
  );
}

export default function DayDetail({ dateKey, sides }: { dateKey: string; sides: Sides }) {
  return (
    <>
      <h2 css={titleStyle}>{monthDayLabel(dateKey)}</h2>
      {sides.mine && <Kept entry={sides.mine} whose="내가" />}
      {sides.theirs && <Kept entry={sides.theirs} whose="상대가" />}
    </>
  );
}

const titleStyle = css`
  margin: 0.5rem 0 1.5rem;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const keptStyle = css`
  margin-bottom: 2rem;
`;

const shotStyle = css`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-card);
  background: var(--color-faint);
`;

/* 색 막대가 글줄과 같은 키다. 메모가 두 줄이 되면 막대도 같이 자란다. */
const lineStyle = css`
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  margin: 1rem 0 0;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const colorStyle = css`
  flex: 0 0 auto;
  width: 0.875rem;
  min-height: 1.75rem;
  border-radius: var(--radius-pill);
`;
