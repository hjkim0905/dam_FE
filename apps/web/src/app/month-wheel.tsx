/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { Column, bandStyle } from './wheel';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MonthWheel({
  years,
  monthKey,
  onChange,
}: {
  years: readonly number[];
  monthKey: string;
  onChange: (monthKey: string) => void;
}) {
  const [year, month] = monthKey.split('-').map(Number);
  const pick = (nextYear: number, nextMonth: number) =>
    onChange(`${nextYear}-${`${nextMonth}`.padStart(2, '0')}`);

  return (
    <div css={wheelStyle}>
      <div css={bandStyle} aria-hidden />
      <Column values={years} suffix="년" chosen={year} onChoose={(y) => pick(y, month)} />
      <Column values={MONTHS} suffix="월" chosen={month} onChoose={(m) => pick(year, m)} />
    </div>
  );
}

const wheelStyle = css`
  position: relative;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
`;

