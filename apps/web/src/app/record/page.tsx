/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { requestHaptic } from '@/lib/bridge';
import { averageColor, pixelAt, rgbToHex } from '@/lib/color';
import { toDateKey, upsertEntry } from '@/lib/entries';
import { loadEntries, saveEntries } from '@/lib/entry-store';
import { coverRect, fitSize } from '@/lib/image';

const MAX_STORED_EDGE = 640;
const JPEG_QUALITY = 0.6;
const FALLBACK_COLOR = '#c9c5c1';

async function toStoredPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitSize(bitmap, MAX_STORED_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export default function Record() {
  const router = useRouter();
  const photoRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<ImageData | null>(null);

  const [photo, setPhoto] = useState('');
  const [color, setColor] = useState(FALLBACK_COLOR);
  const [memo, setMemo] = useState('');
  const [picking, setPicking] = useState(false);
  const [ink, setInk] = useState('');
  const [spread, setSpread] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const box = photoRef.current;
    if (!photo || !box) return;

    const image = new Image();
    image.onload = () => {
      const { width, height } = box.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      const rect = coverRect(image, { width, height });
      context.drawImage(image, rect.x, rect.y, rect.width, rect.height);

      const pixels = context.getImageData(0, 0, width, height);
      pixelsRef.current = pixels;
      const average = averageColor(pixels.data);
      setColor(average ? rgbToHex(average) : FALLBACK_COLOR);
    };
    image.src = photo;
  }, [photo]);

  useEffect(() => {
    if (!ink) return;
    const frame = requestAnimationFrame(() => setSpread(true));
    return () => cancelAnimationFrame(frame);
  }, [ink]);

  const pick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const box = photoRef.current;
    const pixels = pixelsRef.current;
    if (!box || !pixels) return;

    const bounds = box.getBoundingClientRect();
    const next = rgbToHex(
      pixelAt(
        pixels.data,
        pixels.width,
        event.clientX - bounds.left,
        event.clientY - bounds.top
      )
    );
    setColor((current) => {
      if (current !== next) requestHaptic('selection');
      return next;
    });
  }, []);

  const commit = () => {
    const entry = { date: toDateKey(new Date()), color: ink, imageUrl: photo, memo: memo.trim() };
    if (!saveEntries(upsertEntry(loadEntries(), entry))) {
      setInk('');
      setSpread(false);
      setFailed(true);
      return;
    }
    router.replace('/#today');
  };

  return (
    <main
      css={css`
        display: flex;
        height: 100%;
        flex-direction: column;
        padding: 3rem var(--space-edge) 0;
      `}
    >
      {photo ? (
        <>
          <div
            ref={photoRef}
            onPointerDown={(e) => {
              setPicking(true);
              pick(e);
            }}
            onPointerMove={(e) => picking && pick(e)}
            onPointerUp={() => setPicking(false)}
            onPointerCancel={() => setPicking(false)}
            css={css`
              position: relative;
              width: 100%;
              aspect-ratio: 1;
              border-radius: var(--radius-card);
              overflow: hidden;
              background: var(--color-faint);
              touch-action: none;
              animation: rise var(--duration-slow) var(--ease-out-expo) both;

              @keyframes rise {
                from {
                  opacity: 0;
                  transform: scale(0.98);
                }
              }
            `}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="오늘 담은 사진"
              css={css`
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
              `}
            />
          </div>

          <p
            css={css`
              margin: 1.25rem 0 0;
              text-align: center;
              font-size: 0.8125rem;
              letter-spacing: 0.02em;
              color: var(--color-muted);
              transition: opacity var(--duration-fast);
            `}
            style={{ opacity: picking ? 0 : 1 }}
          >
            사진을 문질러 오늘의 색을 고르세요
          </p>

          <div
            css={css`
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-top: auto;
              padding: 1.5rem 0;
            `}
          >
            <div
              css={css`
                flex: 0 0 auto;
                width: 3.5rem;
                height: 5rem;
                border-radius: var(--radius-pill);
                transition: background-color var(--duration-fast) linear;
              `}
              style={{ backgroundColor: color }}
            />
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="이 색에 담을 한 줄"
              css={css`
                flex: 1;
                min-width: 0;
                padding: 1rem 0;
                border: none;
                border-bottom: 0.0625rem solid var(--color-faint);
                background: none;
                color: inherit;
                font: inherit;
                outline: none;

                &::placeholder {
                  color: var(--color-faint);
                }
                &:focus {
                  border-bottom-color: var(--color-muted);
                }
              `}
            />
          </div>

          {failed && (
            <p
              css={css`
                margin: 0 0 1rem;
                text-align: center;
                font-size: 0.8125rem;
                color: oklch(55% 0.18 25);
              `}
            >
              저장 공간이 부족해요. 지난 기록을 정리해 주세요.
            </p>
          )}

          <button
            type="button"
            onClick={() => setInk(color)}
            css={css`
              margin-bottom: 2rem;
              padding: 1.125rem;
              border: none;
              border-radius: var(--radius-pill);
              color: var(--color-background);
              font: inherit;
              font-weight: 600;
              transition: transform var(--duration-fast) var(--ease-out-expo);

              &:active {
                transform: scale(0.97);
              }
            `}
            style={{ backgroundColor: color }}
          >
            담기
          </button>
        </>
      ) : (
        <label
          css={css`
            display: flex;
            flex: 1;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            padding-bottom: 6rem;
          `}
        >
          <span
            css={css`
              width: 6rem;
              height: 8rem;
              border: 0.125rem dashed var(--color-faint);
              border-radius: var(--radius-pill);
            `}
          />
          <span
            css={css`
              font-size: 1.0625rem;
              font-weight: 600;
              letter-spacing: -0.01em;
            `}
          >
            오늘의 사진 한 장
          </span>
          <span
            css={css`
              margin-top: -1rem;
              font-size: 0.8125rem;
              color: var(--color-muted);
            `}
          >
            찍거나 앨범에서 고르세요
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setPhoto(await toStoredPhoto(file));
            }}
            css={css`
              display: none;
            `}
          />
        </label>
      )}

      {ink && (
        <div
          onTransitionEnd={commit}
          css={css`
            position: fixed;
            top: 50%;
            left: 50%;
            width: 1.5rem;
            height: 1.5rem;
            margin: -0.75rem 0 0 -0.75rem;
            border-radius: var(--radius-pill);
            transition: transform var(--duration-ink) var(--ease-ink);
            pointer-events: none;
          `}
          style={{ backgroundColor: ink, transform: `scale(${spread ? 140 : 1})` }}
        />
      )}
    </main>
  );
}
