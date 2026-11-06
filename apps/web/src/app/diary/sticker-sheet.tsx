/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';
import type { Entry } from '@/lib/entries';
import { isNativeApp, requestHaptic } from '@/lib/bridge';
import { cutoutFrame, dateLabel } from '@/lib/diary';
import Sheet from '../sheet';
import { cutoutSrc, LIFT_MS, loadCutout } from './page-art';
import { STICKER_NAMES, stickerUrl } from './stickers';

const TABS = [
  { key: 'photo', label: '사진' },
  { key: 'cutout', label: '누끼' },
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
/* 손가락이 이만큼 움직이면 누르고 있는 것이 아니라 끄는 것이다. */
const PRESS_SLOP_PX = 8;

type Tab = (typeof TABS)[number]['key'];
type Frame = (typeof FRAMES)[number]['key'];

type Props = {
  open: boolean;
  onClose: () => void;
  /** 이 책에 아직 안 붙인 사진들. 붙인 사진은 부르는 쪽이 이미 뺐다. */
  photos: readonly Entry[] | null;
  /** frame 은 사진 틀이거나 누끼 이름(cutout-42-60)이다. */
  onPhoto: (entryId: number, frame: string) => void;
  onSticker: (name: string) => void;
  onText: (text: string) => void;
};

const segments = css`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: var(--radius-pill);
  background: var(--color-faint);

  button {
    padding: 0.5rem 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-muted);
    transition: background var(--duration-fast) var(--ease-out-expo), color var(--duration-fast) var(--ease-out-expo);
  }

  button[aria-pressed='true'],
  button[aria-checked='true'] {
    background: var(--color-background);
    color: var(--color-foreground);
    box-shadow: 0 0.0625rem 0.25rem rgba(90, 77, 68, 0.15);
  }
`;

const action = css`
  width: 100%;
  padding: 0.875rem 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-foreground);
  color: var(--color-background);
  transition: transform var(--duration-fast) var(--ease-out-expo), opacity var(--duration-fast) linear;

  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.35; }
`;

const quiet = css`
  ${action};
  background: var(--color-faint);
  color: var(--color-foreground);
`;

const muted = css`margin: 0; color: var(--color-muted); text-align: center;`;

const thumbs = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
`;

const thumb = css`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  transition: transform var(--duration-fast) var(--ease-out-expo);

  &:active { transform: scale(0.95); }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--radius-thumb);
  }
`;

const stickers = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;

  button {
    padding: 0.5rem;
    border: 0;
    border-radius: var(--radius-thumb);
    background: transparent;
    transition: transform var(--duration-fast) var(--ease-out-expo);
  }

  button:active { transform: scale(0.9); }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: contain;
  }
`;

function PhotoGrid({ photos, onPick }: { photos: readonly Entry[] | null; onPick: (entry: Entry) => void }) {
  if (photos === null) return <p css={muted}>사진을 불러오는 중이에요</p>;
  if (photos.length === 0) return <p css={muted}>담은 사진을 모두 붙였어요</p>;
  return (
    <div css={thumbs}>
      {photos.map((entry) => (
        <button key={entry.id} type="button" css={thumb} onClick={() => onPick(entry)}>
          {/* 서명된 스토리지 주소라 next/image 의 최적화를 거칠 수 없다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.imageUrl} alt="" css={css`background: ${entry.color};`} />
          {dateLabel(entry.date)}
        </button>
      ))}
    </div>
  );
}

function Back({ entry, onBack }: { entry: Entry; onBack: () => void }) {
  return (
    <div css={css`display: flex; align-items: center; justify-content: space-between;`}>
      <button type="button" onClick={onBack} css={css`padding: 0.5rem 0; border: 0; background: transparent; color: var(--color-foreground);`}>
        ‹ 사진 목록
      </button>
      <span css={css`color: var(--color-muted);`}>{dateLabel(entry.date)}</span>
    </div>
  );
}

/** 고른 틀을 씌운 모습을 미리 보여 준다. 붙인 뒤에 보이는 모양과 같아야 고르기 쉽다. */
function Framed({ entry, frame }: { entry: Entry; frame: Frame }) {
  const shapes: Record<Frame, string> = {
    polaroid: 'padding: 0.6rem 0.6rem 2.4rem; background: #fff;',
    round: 'border-radius: 50%; border: 0.4rem solid #fff;',
    tape: 'padding: 0.5rem; background: #fff;',
  };
  return (
    <div css={css`position: relative; width: min(60vw, 15rem); box-shadow: 0 0.5rem 1.25rem rgba(90, 77, 68, 0.18); ${shapes[frame]} overflow: ${frame === 'round' ? 'hidden' : 'visible'};`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={entry.imageUrl} alt="" css={css`display: block; width: 100%; aspect-ratio: 1; object-fit: cover;`} />
      {frame === 'tape' && (
        <span css={css`position: absolute; top: -0.6rem; left: 50%; width: 40%; height: 1.4rem; transform: translateX(-50%) rotate(-3deg); background: rgba(242, 167, 180, 0.75);`} />
      )}
    </div>
  );
}

function PhotoTab({ photos, onPhoto }: Pick<Props, 'photos' | 'onPhoto'>) {
  const [chosen, setChosen] = useState<Entry | null>(null);
  const [frame, setFrame] = useState<Frame>('polaroid');
  if (!chosen) return <PhotoGrid photos={photos} onPick={setChosen} />;
  return (
    <div css={css`display: flex; flex-direction: column; gap: 1.25rem;`}>
      <Back entry={chosen} onBack={() => setChosen(null)} />
      <div css={css`display: grid; place-items: center; padding: 0.5rem 0;`}>
        <Framed entry={chosen} frame={frame} />
      </div>
      <div css={segments} role="radiogroup" aria-label="사진 틀">
        {FRAMES.map(({ key, label }) => (
          <button key={key} type="button" role="radio" aria-checked={frame === key} onClick={() => setFrame(key)}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" css={action} onClick={() => onPhoto(chosen.id, frame)}>이 사진 붙이기</button>
    </div>
  );
}

function Lifter({ entry, onPhoto }: { entry: Entry } & Pick<Props, 'onPhoto'>) {
  const [lifted, setLifted] = useState<{ frame: string; src: string } | null>(null);
  const [state, setState] = useState<'idle' | 'cutting' | 'missed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const native = isNativeApp();

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const press = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!native || state === 'cutting') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    origin.current = { x: event.clientX, y: event.clientY };
    stop();
    timer.current = setTimeout(() => {
      requestHaptic('medium');
      setState('cutting');
      const name = cutoutFrame(point);
      void loadCutout(entry.id, entry.imageUrl, name).then((ok) => {
        const src = ok ? cutoutSrc(entry.id, name) : undefined;
        setLifted(src ? { frame: name, src } : null);
        setState(src ? 'idle' : 'missed');
      });
    }, LIFT_MS);
  };

  const drift = (event: React.PointerEvent) => {
    const from = origin.current;
    if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > PRESS_SLOP_PX) stop();
  };

  const guide = (() => {
    if (!native) return '누끼는 아이폰 앱에서 딸 수 있어요';
    if (state === 'cutting') return '떼어 내는 중이에요…';
    if (state === 'missed') return '거기엔 떼어 낼 게 없어요. 다른 부분을 꾹 눌러 보세요';
    if (lifted) return '이렇게 떼어 냈어요';
    return '사진 속에서 떼어 내고 싶은 부분을 꾹 눌러 보세요';
  })();

  return (
    <>
      <p css={css`margin: 0; text-align: center; color: var(--color-foreground);`}>{guide}</p>
      <div
        css={css`
          display: grid;
          place-items: center;
          min-height: 14rem;
          padding: 1rem;
          border-radius: var(--radius-card);
          background: ${lifted ? 'var(--diary-desk, #efe8dd)' : 'transparent'};
        `}
      >
        {/* 서명된 스토리지 주소와 data URL 이라 next/image 의 최적화를 거칠 수 없다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lifted?.src ?? entry.imageUrl}
          alt=""
          draggable={false}
          onPointerDown={lifted ? undefined : press}
          onPointerMove={drift}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
          css={css`
            display: block;
            max-width: 100%;
            max-height: 38vh;
            border-radius: ${lifted ? '0' : 'var(--radius-thumb)'};
            filter: ${lifted ? 'drop-shadow(0 0 0.15rem #fff) drop-shadow(0 0 0.15rem #fff) drop-shadow(0 0.25rem 0.5rem rgba(0, 0, 0, 0.2))' : 'none'};
            opacity: ${state === 'cutting' ? 0.55 : 1};
            transition: opacity var(--duration-fast) var(--ease-out-expo);
            -webkit-touch-callout: none;
            user-select: none;
            touch-action: none;
          `}
        />
      </div>
      <div css={css`display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;`}>
        <button type="button" css={quiet} disabled={!lifted} onClick={() => setLifted(null)}>다시 고르기</button>
        <button type="button" css={action} disabled={!lifted} onClick={() => lifted && onPhoto(entry.id, lifted.frame)}>
          스티커로 붙이기
        </button>
      </div>
    </>
  );
}

function CutoutTab({ photos, onPhoto }: Pick<Props, 'photos' | 'onPhoto'>) {
  const [chosen, setChosen] = useState<Entry | null>(null);
  if (!chosen) {
    return (
      <div css={css`display: flex; flex-direction: column; gap: 1rem;`}>
        <p css={muted}>사진을 고르면 그 안의 사람이나 물건을 스티커로 떼어 낼 수 있어요</p>
        <PhotoGrid photos={photos} onPick={setChosen} />
      </div>
    );
  }
  return (
    <div css={css`display: flex; flex-direction: column; gap: 1rem;`}>
      <Back entry={chosen} onBack={() => setChosen(null)} />
      <Lifter key={chosen.id} entry={chosen} onPhoto={onPhoto} />
    </div>
  );
}

function TextTab({ onText }: Pick<Props, 'onText'>) {
  const [text, setText] = useState('');
  const written = text.trim();
  return (
    <form
      css={css`display: flex; flex-direction: column; gap: 0.75rem;`}
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
        aria-label="붙일 글씨"
        css={css`
          min-width: 0;
          padding: 0.875rem 1rem;
          border: 0.125rem solid var(--color-faint);
          border-radius: var(--radius-thumb);
          background: var(--color-background);
          color: var(--color-foreground);
        `}
      />
      <button type="submit" css={action} disabled={!written}>붙이기</button>
    </form>
  );
}

export default function StickerSheet({ open, onClose, photos, onPhoto, onSticker, onText }: Props) {
  const [tab, setTab] = useState<Tab>('photo');
  return (
    <Sheet open={open} label="꾸미기" onClose={onClose} fill={false}>
      <div css={css`display: flex; flex-direction: column; gap: 1.25rem;`}>
        <nav css={segments} aria-label="꾸밀 것">
          {TABS.map(({ key, label }) => (
            <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
        {tab === 'photo' && <PhotoTab photos={photos} onPhoto={onPhoto} />}
        {tab === 'cutout' && <CutoutTab photos={photos} onPhoto={onPhoto} />}
        {tab === 'sticker' && (
          <div css={stickers}>
            {STICKER_NAMES.map((name) => (
              <button key={name} type="button" onClick={() => onSticker(name)} aria-label={name}>
                {/* 256px 정사각 그림이라 next/image 의 최적화가 할 일이 없다. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stickerUrl(name)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        {tab === 'text' && <TextTab onText={onText} />}
      </div>
    </Sheet>
  );
}
