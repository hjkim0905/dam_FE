/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';

export default function CalendarScreen() {
  return (
    <main
      css={css`
        display: flex;
        height: 100%;
        flex-direction: column;
        padding: 4.5rem var(--space-edge) 0;
      `}
    >
      <h1
        css={css`
          margin: 0;
          font-size: 1.75rem;
          font-weight: 400;
          letter-spacing: -0.02em;
        `}
      >
        2026년 8월
      </h1>
    </main>
  );
}
