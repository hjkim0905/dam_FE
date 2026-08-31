/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';

/** 기다림이 눈에 보이는 자리에 덮는다. 그 사이 화면을 못 만지게 하는 것도 역할이다. */
export default function LoadingCapsule({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" css={sheetStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/loading-capsule.webp"
        alt=""
        width={192}
        height={192}
        css={css`
          width: 4rem;
          height: 4rem;
        `}
      />
      <span
        css={css`
          font-size: 0.8125rem;
          color: var(--color-muted);
        `}
      >
        {label}
      </span>
    </div>
  );
}

const sheetStyle = css`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-background);
  animation: appear var(--duration-fast) var(--ease-out-expo) both;

  @keyframes appear {
    from {
      opacity: 0;
    }
  }
`;
