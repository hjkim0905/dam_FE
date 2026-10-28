/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

/* three.js 는 이 탭을 열 때만 내려받는다. 다른 화면의 첫 로드에 얹히지 않게 한다. */
const Book = dynamic(() => import('./book'), { ssr: false });
const Peel = dynamic(() => import('./peel'), { ssr: false });

const MODES = [
  { key: 'book', label: '책' },
  { key: 'peel', label: '스티커' },
] as const;

type Mode = (typeof MODES)[number]['key'];

export default function DiaryPage() {
  const [mode, setMode] = useState<Mode>('book');

  return (
    <main
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--color-background);
      `}
    >
      <nav
        css={css`
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          padding: 2.25rem var(--space-edge) 0;
        `}
      >
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
            css={css`
              padding: 0.5rem 1.25rem;
              border: 0;
              border-radius: var(--radius-pill);
              background: var(--color-faint);
              color: var(--color-muted);
              transition: background var(--duration-fast) var(--ease-out-expo),
                color var(--duration-fast) var(--ease-out-expo);

              &[aria-pressed='true'] {
                background: var(--color-foreground);
                color: var(--color-background);
              }
            `}
          >
            {label}
          </button>
        ))}
      </nav>
      {/* 양모 테두리는 모든 화면 위를 덮는다. 책이 그 밑으로 들어가지 않게 안쪽에만 그린다. */}
      <div
        css={css`
          flex: 1;
          min-height: 0;
          padding: 1rem 1.75rem 1.75rem;
        `}
      >
        {mode === 'book' ? <Book /> : <Peel />}
      </div>
    </main>
  );
}
