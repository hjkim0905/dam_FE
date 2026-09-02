/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { requestHaptic } from '@/lib/bridge';
import { snappedIndex } from '@/lib/carousel';

const ROW_REM = 2.75;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function rowPx() {
  return ROW_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function Column({
  values,
  suffix,
  chosen,
  onChoose,
}: {
  values: readonly number[];
  suffix: string;
  chosen: number;
  onChoose: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settling = useRef(0);

  useEffect(() => {
    const column = ref.current;
    const index = values.indexOf(chosen);
    if (!column || index < 0) return;

    // 고른 값이 바뀔 때마다 이 자리로 되돌리면, 손이 굴려 놓은 관성을 밀어친다.
    // 눈금 반 칸 넘게 어긋났을 때만 바로잡는다.
    const target = index * rowPx();
    if (Math.abs(column.scrollTop - target) < rowPx() / 2) return;

    column.style.scrollBehavior = 'auto';
    column.scrollTop = target;
    column.style.scrollBehavior = '';
  }, [values, chosen]);

  useEffect(() => () => window.clearTimeout(settling.current), []);

  const onScroll = () => {
    const column = ref.current;
    if (!column) return;

    const next = values[snappedIndex(column.scrollTop, rowPx(), values.length)];
    if (next === chosen) return;

    requestHaptic('selection');
    // 스크롤 중엔 매 눈금마다 고르지 않는다. 멈춘 자리가 고른 값이다.
    window.clearTimeout(settling.current);
    settling.current = window.setTimeout(() => onChoose(next), 90);
  };

  return (
    <div ref={ref} onScroll={onScroll} css={columnStyle}>
      {values.map((value) => (
        <span key={value} css={rowStyle} data-chosen={value === chosen}>
          {value}
          {suffix}
        </span>
      ))}
    </div>
  );
}

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

/* 고르는 자리. 눈금 뒤에 깔려서 어느 줄이 선택인지 말한다. */
const bandStyle = css`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: ${ROW_REM}rem;
  transform: translateY(-50%);
  border-radius: var(--radius-thumb);
  background: var(--color-faint);
`;

/* 위아래로 흐려져야 기둥이 도는 것처럼 읽힌다. 그냥 잘리면 목록을 자른 것으로 보인다. */
const columnStyle = css`
  position: relative;
  height: ${ROW_REM * 5}rem;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 ${ROW_REM * 1.6}rem,
    #000 calc(100% - ${ROW_REM * 1.6}rem),
    transparent
  );
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;

  /* 첫 줄과 마지막 줄도 가운데 설 수 있으려면 위아래 여백이 필요하다. 패딩으로 주면
     WebKit 이 끝쪽 패딩을 scrollHeight 에 넣지 않아 그만큼 못 굴러간다. */
  &::before,
  &::after {
    content: '';
    display: block;
    height: ${ROW_REM * 2}rem;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const rowStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${ROW_REM}rem;
  scroll-snap-align: center;
  font-size: 0.875rem;
  color: var(--color-muted);
  transition: color var(--duration-fast) linear;

  &[data-chosen='true'] {
    color: var(--color-foreground);
  }
`;
