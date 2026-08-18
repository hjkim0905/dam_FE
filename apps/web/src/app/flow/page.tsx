/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';

const DEMO_COLORS = [
  '#8a9a7b', '#c98d6b', '#5f7d95', '#d4b483', '#7d6b8a',
  '#a86b6b', '#6b8a80', '#9a8a6b', '#6b7d9a', '#b39a7d',
];

export default function Flow() {
  return (
    <main
      css={css`
        position: relative;
        display: flex;
        height: 100%;
        flex-direction: column;
        padding: var(--space-safe-top) var(--space-edge) var(--space-safe-bottom);
      `}
    >
      <h1
        css={css`
          position: absolute;
          top: calc(var(--space-safe-top) + 3rem);
          left: var(--space-edge);
          margin: 0;
          font-size: 1.75rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        `}
      >
        올해의 흐름
      </h1>

      <div
        css={css`
          flex: 1;
          display: flex;
          align-items: center;
        `}
      >
        <div
          css={css`
            width: 100%;
            height: 8rem;
            border-radius: 999rem;
          `}
          style={{
            background: `linear-gradient(to right, ${DEMO_COLORS.join(', ')})`,
          }}
        />
      </div>
    </main>
  );
}
