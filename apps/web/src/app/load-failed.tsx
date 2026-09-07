/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';

/**
 * 그 달의 기록을 못 받았을 때. 빈 배열로 넘겨 "아직 담은 색이 없어요" 를 띄우면,
 * 사용자는 서버가 아니라 자기 기록이 사라졌다고 읽는다.
 */
export default function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div css={boxStyle}>
      <p css={textStyle}>기록을 불러오지 못했어요</p>
      <button type="button" onClick={onRetry} css={retryStyle}>
        다시 시도
      </button>
    </div>
  );
}

const boxStyle = css`
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const textStyle = css`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const retryStyle = css`
  padding: 0.625rem 1.5rem;
  border: 0.0625rem solid var(--color-faint);
  border-radius: var(--radius-pill);
  background: none;
  color: var(--color-foreground);
  font: inherit;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out-expo),
    border-color var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover {
      border-color: var(--color-muted);
    }
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;
