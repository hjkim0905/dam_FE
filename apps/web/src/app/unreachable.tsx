/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useState } from 'react';

/**
 * 서버에 닿지 못했을 때. 로그인 화면으로 보내지 않는 것이 요점이다. 연결이
 * 끊긴 것은 세션이 죽은 것과 다른데, 같이 다루면 지하철에서 앱을 연 사람이
 * 애플 로그인부터 다시 해야 한다.
 */
export default function Unreachable({ onRetry }: { onRetry: () => Promise<void> }) {
  const [trying, setTrying] = useState(false);

  const retry = () => {
    setTrying(true);
    void onRetry().finally(() => setTrying(false));
  };

  return (
    <main css={screenStyle}>
      <h1 css={headingStyle}>연결이 닿지 않아요</h1>
      <p css={bodyStyle}>
        담아둔 색은 그대로 있어요.
        <br />
        연결을 확인하고 다시 시도해 주세요.
      </p>
      <button type="button" onClick={retry} disabled={trying} css={retryStyle}>
        {trying ? '연결하는 중' : '다시 시도'}
      </button>
    </main>
  );
}

const screenStyle = css`
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0 var(--space-edge);
  text-align: center;
`;

/* 위계는 굵기가 아니라 크기로 준다. 갈무리에 볼드 페이스가 없어서
   font-weight 를 올리면 브라우저가 합성 볼드로 픽셀을 뭉갠다. */
const headingStyle = css`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--color-foreground);
`;

const bodyStyle = css`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-muted);
`;

const retryStyle = css`
  padding: 0.875rem 2rem;
  border: 0.0625rem solid var(--color-faint);
  border-radius: var(--radius-pill);
  background: none;
  color: var(--color-foreground);
  font: inherit;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out-expo),
    border-color var(--duration-fast) linear,
    opacity var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      border-color: var(--color-muted);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;
