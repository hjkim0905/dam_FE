/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { strings } from '@/lib/i18n';
import { Column, bandStyle } from './wheel';

export default function YearWheel({
  years,
  year,
  onChange,
}: {
  years: readonly number[];
  year: number;
  onChange: (year: number) => void;
}) {
  const s = strings();

  return (
    <div css={wheelStyle}>
      <div css={bandStyle} aria-hidden />
      <Column values={years} suffix={s.yearSuffix} chosen={year} onChoose={onChange} />
    </div>
  );
}

const wheelStyle = css`
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;
