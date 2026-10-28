/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useState } from 'react';
import type { Entry } from '@/lib/entries';
import { dateLabel } from '@/lib/diary';
import Sheet from '../sheet';
import { STICKER_NAMES, spriteUrl } from './stickers';

const TABS = [
  { key: 'photo', label: '사진' },
  { key: 'sticker', label: '스티커' },
  { key: 'text', label: '글씨' },
] as const;

const FRAMES = [
  { key: 'polaroid', label: '폴라로이드' },
  { key: 'round', label: '동그라미' },
  { key: 'tape', label: '테이프' },
] as const;

/* 서버(DiaryItem.java)의 한도와 같다. 넘기면 서버가 받지 않는다. */
const MAX_TEXT = 80;

type Tab = (typeof TABS)[number]['key'];
type Frame = (typeof FRAMES)[number]['key'];

type Props = {
  open: boolean;
  onClose: () => void;
  /** 이 책에 아직 안 붙인 사진들. 붙인 사진은 부르는 쪽이 이미 뺐다. */
  photos: readonly Entry[] | null;
  onPhoto: (entryId: number, frame: Frame) => void;
  onSticker: (name: string) => void;
  onText: (text: string) => void;
};

const chip = css`
  padding: 0.5rem 1rem;
  white-space: nowrap;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-faint);
  color: var(--color-muted);
  transition: background var(--duration-fast) var(--ease-out-expo), color var(--duration-fast) var(--ease-out-expo);

  &[aria-pressed='true'] {
    background: var(--color-foreground);
    color: var(--color-background);
  }
`;

const grid = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem 0;
`;

const tile = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 0;
  border-radius: var(--radius-thumb);
  background: transparent;
  color: var(--color-muted);
  transition: transform var(--duration-fast) var(--ease-out-expo);

  &:active {
    transform: scale(0.92);
  }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: contain;
    image-rendering: pixelated;
  }
`;

function PhotoTab({ photos, onPhoto }: Pick<Props, 'photos' | 'onPhoto'>) {
  const [frame, setFrame] = useState<Frame>('polaroid');
  if (photos === null) return <p css={css`color: var(--color-muted);`}>사진을 불러오는 중이에요</p>;
  return (
    <>
      <div css={css`display: flex; gap: 0.5rem; padding-top: 1rem;`}>
        {FRAMES.map(({ key, label }) => (
          <button key={key} type="button" css={chip} aria-pressed={frame === key} onClick={() => setFrame(key)}>
            {label}
          </button>
        ))}
      </div>
      {photos.length === 0 ? (
        <p css={css`color: var(--color-muted); padding: 2rem 0;`}>담은 사진을 모두 붙였어요</p>
      ) : (
        <div css={grid}>
          {photos.map((entry) => (
            <button key={entry.id} type="button" css={tile} onClick={() => onPhoto(entry.id, frame)}>
              {/* 서명된 스토리지 주소라 next/image 의 최적화를 거칠 수 없다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.imageUrl}
                alt=""
                css={css`
                  object-fit: cover;
                  image-rendering: auto;
                  border-radius: var(--radius-thumb);
                  background: ${entry.color};
                `}
              />
              {dateLabel(entry.date)}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function TextTab({ onText }: Pick<Props, 'onText'>) {
  const [text, setText] = useState('');
  const written = text.trim();
  return (
    <form
      css={css`display: flex; gap: 0.5rem; padding-top: 1rem;`}
      onSubmit={(event) => {
        event.preventDefault();
        if (written) onText(written);
        setText('');
      }}
    >
      <input
        value={text}
        maxLength={MAX_TEXT}
        onChange={(event) => setText(event.target.value)}
        placeholder="한 줄 적기"
        css={css`
          flex: 1;
          min-width: 0;
          padding: 0.75rem 1rem;
          border: 0.125rem solid var(--color-faint);
          border-radius: var(--radius-pill);
          background: var(--color-background);
          color: var(--color-foreground);
        `}
      />
      <button type="submit" css={chip} aria-pressed={written.length > 0} disabled={!written}>
        붙이기
      </button>
    </form>
  );
}

export default function StickerSheet({ open, onClose, photos, onPhoto, onSticker, onText }: Props) {
  const [tab, setTab] = useState<Tab>('photo');
  return (
    <Sheet open={open} label="꾸미기" onClose={onClose} fill={false}>
      <nav css={css`display: flex; gap: 0.5rem;`}>
        {TABS.map(({ key, label }) => (
          <button key={key} type="button" css={chip} aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'photo' && <PhotoTab photos={photos} onPhoto={onPhoto} />}
      {tab === 'sticker' && (
        <div css={grid}>
          {STICKER_NAMES.map((name) => (
            <button key={name} type="button" css={tile} onClick={() => onSticker(name)} aria-label={name}>
              {/* 캔버스로 만든 data URL 이다. 내려받을 것이 없다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spriteUrl(name)} alt="" />
            </button>
          ))}
        </div>
      )}
      {tab === 'text' && <TextTab onText={onText} />}
    </Sheet>
  );
}
