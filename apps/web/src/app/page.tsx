/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';

export default function Home() {
  return (
    <main
      css={css`
        display: flex;
        min-height: 100dvh;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
      `}
    >
      <h1
        css={css`
          margin: 0;
          font-size: 2rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        `}
      >
        담.
      </h1>
      <p
        css={css`
          margin: 0;
          font-size: 0.95rem;
          opacity: 0.6;
        `}
      >
        하루를 색으로 담다
      </p>
    </main>
  );
}
