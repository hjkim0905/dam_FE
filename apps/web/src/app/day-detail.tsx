/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { monthDayLabel } from '@/lib/entries';
import type { Entry, Sides } from '@/lib/entries';

function Said({ entry, whose }: { entry: Entry; whose: string }) {
  return (
    <p css={saidStyle}>
      <span css={colorStyle} style={{ background: entry.color }} />
      <span>{entry.memo || `${whose} 담은 색`}</span>
    </p>
  );
}

export default function DayDetail({ dateKey, sides }: { dateKey: string; sides: Sides }) {
  const kept = [sides.mine, sides.theirs].filter((e): e is Entry => e !== null);
  const together = kept.length === 2;

  return (
    <>
      <h2 css={titleStyle}>{monthDayLabel(dateKey)}</h2>

      {/* 달력 칸과 같은 규칙으로 커진다 — 왼쪽이 나, 오른쪽이 상대. 사진마다 틀을
          주지 않고 하나가 잘라내므로, 가른 선이 아래 메모 단까지 그대로 이어진다. */}
      <div css={[frameStyle, together && tallFrameStyle]}>
        {kept.map((entry) => (
          <img
            key={entry.author}
            src={entry.imageUrl}
            alt={`${monthDayLabel(dateKey)} ${entry === sides.mine ? '내가' : '상대가'} 담은 사진`}
          />
        ))}
      </div>

      <div css={[saidRowStyle, together && splitSaidStyle]}>
        {sides.mine && <Said entry={sides.mine} whose="내가" />}
        {sides.theirs && <Said entry={sides.theirs} whose="상대가" />}
      </div>
    </>
  );
}

const titleStyle = css`
  margin: 0.5rem 0 1.75rem;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const frameStyle = css`
  display: flex;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-faint);

  img {
    flex: 1;
    min-width: 0;
    height: 100%;
    object-fit: cover;
  }
`;

/* 둘이면 각자 반쪽이라 정사각으로 두면 좁고 길어진다. 틀을 낮춰 반쪽이 세로 사진이 된다. */
const tallFrameStyle = css`
  aspect-ratio: 4 / 3;
`;

const saidRowStyle = css`
  display: grid;
  margin-top: 1.25rem;
`;

const splitSaidStyle = css`
  grid-template-columns: 1fr 1fr;
  column-gap: 1rem;
`;

const saidStyle = css`
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

/* 색 막대가 글줄과 같은 키다. 메모가 여러 줄이 되면 막대도 같이 자란다. */
const colorStyle = css`
  flex: 0 0 auto;
  width: 0.875rem;
  min-height: 1.75rem;
  border-radius: var(--radius-pill);
`;
