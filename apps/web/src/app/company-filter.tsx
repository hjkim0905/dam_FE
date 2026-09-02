/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import type { Company } from '@/lib/entries';

const VIEWS: { value: Company; label: string }[] = [
  { value: 'mine', label: '내것' },
  { value: 'both', label: '함께' },
  { value: 'theirs', label: '상대것' },
];

/** 상대가 담은 것이 하나도 없으면 그리지 않는다 — 고를 것이 하나뿐인 필터는 소음이다. */
export default function CompanyFilter({
  view,
  onChange,
}: {
  view: Company;
  onChange: (view: Company) => void;
}) {
  return (
    <nav css={segmentStyle} aria-label="누구의 기록을 볼지">
      {VIEWS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          css={[choiceStyle, view === value && chosenStyle]}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

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

