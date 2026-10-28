/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import type { Book } from '@/lib/api/diary';
import { shade } from '@/lib/color';
import { shelfYears } from '@/lib/diary';

/* 아직 안 만든 올해 책의 표지. 펼치면 서버가 해마다 다른 색으로 만든다. */
const UNMADE = '#ead9c6';

type Props = {
  books: readonly Book[];
  thisYear: number;
  onOpen: (year: number) => void;
};

/** 해마다 한 권씩 꽂힌 책장. 올해 책은 아직 없어도 맨 앞에 자리가 있다. */
export default function Shelf({ books, thisYear, onOpen }: Props) {
  const byYear = new Map(books.map((book) => [book.year, book]));
  return (
    <section
      aria-label="책장"
      css={css`
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem 1.5rem;
        align-content: start;
        padding: 3.5rem 2rem 2rem;
        height: 100%;
        overflow-y: auto;
      `}
    >
      {shelfYears(books.map((book) => book.year), thisYear).map((year) => {
        const book = byYear.get(year);
        const color = book?.coverColor ?? UNMADE;
        return (
          <button
            key={year}
            type="button"
            onClick={() => onOpen(year)}
            css={css`
              position: relative;
              aspect-ratio: 1 / 1.4;
              border: 0.25rem solid ${shade(color, 0.25)};
              border-radius: 0.25rem 0.5rem 0.5rem 0.25rem;
              background: ${color};
              color: var(--color-foreground);
              box-shadow: 0.375rem 0.375rem 0 rgba(90, 77, 68, 0.15);
              transition: transform var(--duration-fast) var(--ease-out-expo), box-shadow var(--duration-fast) var(--ease-out-expo);

              &:active {
                transform: translate(0.25rem, 0.25rem);
                box-shadow: 0.125rem 0.125rem 0 rgba(90, 77, 68, 0.15);
              }
            `}
          >
            <span
              css={css`
                position: absolute;
                inset: 18% 12% auto;
                padding: 0.5rem 0;
                background: #fffaf0;
                border: 0.125rem solid ${shade(color, 0.2)};
              `}
            >
              {year}
            </span>
            {book?.shared && (
              <span css={css`position: absolute; bottom: 0.75rem; inset-inline: 0; color: ${shade(color, 0.55)};`}>
                둘이
              </span>
            )}
            {!book && (
              <span css={css`position: absolute; bottom: 0.75rem; inset-inline: 0; color: var(--color-muted);`}>
                새 책
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}
