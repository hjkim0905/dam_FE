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
      aria-labelledby="shelf-title"
      css={css`
        height: 100%;
        overflow-y: auto;
        padding: calc(var(--native-header) + 1rem) 1.75rem 7rem;
      `}
    >
      <h1 id="shelf-title" css={css`margin: 0 0 1.5rem; font-size: 1.75rem; font-weight: 400; color: var(--color-foreground);`}>
        나의 다이어리
      </h1>
      <div css={css`display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem 1.5rem;`}>
        {shelfYears(books.map((book) => book.year), thisYear).map((year) => {
          const book = byYear.get(year);
          if (!book) {
            return (
              <button
                key={year}
                type="button"
                onClick={() => onOpen(year)}
                css={css`
                  aspect-ratio: 1 / 1.4;
                  border: 0.125rem dashed ${shade(UNMADE, 0.25)};
                  border-radius: 0.375rem 0.75rem 0.75rem 0.375rem;
                  background: transparent;
                  color: var(--color-muted);
                  font-size: 1.125rem;
                  transition: transform var(--duration-fast) var(--ease-out-expo);
                  &:active { transform: scale(0.97); }
                `}
              >
                + {year}년 다이어리 만들기
              </button>
            );
          }
          const color = book.coverColor;
          return (
            <button
              key={year}
              type="button"
              onClick={() => onOpen(year)}
              aria-label={`${year}년 다이어리`}
              css={css`
                position: relative;
                aspect-ratio: 1 / 1.4;
                border: 0;
                border-radius: 0.375rem 0.75rem 0.75rem 0.375rem;
                background: ${color};
                color: #4a3f38;
                text-align: left;
                box-shadow: inset 0.5rem 0 0 rgba(0, 0, 0, 0.06), 0 0.75rem 1.5rem rgba(90, 77, 68, 0.22);
                transition: transform var(--duration-fast) var(--ease-out-expo);
                &:active { transform: scale(0.97); }

                &::before {
                  content: '';
                  position: absolute;
                  inset: 0.5rem;
                  border: 0.09rem dashed rgba(255, 255, 255, 0.75);
                  border-radius: 0.5rem;
                }
              `}
            >
              <span
                css={css`
                  position: absolute;
                  top: 20%;
                  left: 12%;
                  right: 24%;
                  display: flex;
                  flex-direction: column;
                  padding: 0.625rem 0.75rem;
                  border-radius: 0.375rem;
                  background: #fdfaf3;
                  box-shadow: 0 0.125rem 0.375rem rgba(0, 0, 0, 0.15);
                `}
              >
                <span css={css`font-size: 1.75rem; line-height: 1;`}>담.</span>
                <span css={css`font-size: 0.9375rem;`}>{year} diary</span>
              </span>
              <span
                aria-hidden="true"
                css={css`
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  right: 12%;
                  width: 0.5rem;
                  background: repeating-linear-gradient(180deg, ${shade(color, 0.3)} 0 0.25rem, ${shade(color, 0.22)} 0.25rem 0.375rem);
                `}
              />
              {book.shared && (
                <span css={css`position: absolute; bottom: 0.875rem; left: 12%; color: #fff; font-size: 1rem;`}>둘이 쓰는 책</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
