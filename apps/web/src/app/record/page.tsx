/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { requestHaptic } from '@/lib/bridge';
import { averageColor, pixelAt, rgbToHex } from '@/lib/color';
import { EVENT, memoShape } from '@/lib/analytics';
import { keepEntry } from '@/lib/api/entries';
import { isApiError } from '@/lib/api/errors';
import { requestUploadUrl } from '@/lib/api/photos';
import { track } from '@/lib/track';
import { toDateKey } from '@/lib/entries';
import { uploadPhoto } from '@/lib/upload';
import { coverRect, fitSize, zoomRect } from '@/lib/image';
import LoadingCapsule from '../loading-capsule';

const MAX_STORED_EDGE = 640;
const JPEG_QUALITY = 0.6;
const PHOTO_TYPE = 'image/jpeg';
const FALLBACK_COLOR = '#c9c5c1';

/* 84 는 배율 3 으로 나누어떨어져야 확대된 픽셀 경계가 반 칸씩 어긋나지 않는다. */
const LOUPE_EDGE = 84;
const LOUPE_ZOOM = 3;
const LOUPE_LIFT = 76;

/**
 * 서버로 보낼 사진. 데이터 URL 이 아니라 Blob 으로 만든다. base64 로 실으면
 * 33% 부풀고, 스토리지로 직접 올리려면 어차피 바이트가 필요하다.
 */
function toStoredPhoto(bitmap: ImageBitmap): Promise<Blob | null> {
  const { width, height } = fitSize(bitmap, MAX_STORED_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, PHOTO_TYPE, JPEG_QUALITY);
  });
}

function drawLoupe(
  loupe: HTMLCanvasElement | null,
  source: HTMLCanvasElement | null,
  at: { x: number; y: number }
): void {
  const context = loupe?.getContext('2d');
  if (!source || !context) return;

  const rect = zoomRect(at, LOUPE_EDGE, LOUPE_ZOOM);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, LOUPE_EDGE, LOUPE_EDGE);
  context.drawImage(
    source,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    LOUPE_EDGE,
    LOUPE_EDGE
  );

  // 집는 칸의 테두리. 어떤 사진 위에 놓일지 모르므로 팔레트 색이 아니라
  // 밝은 선과 어두운 선을 겹쳐 어느 쪽에서도 남게 한다.
  const mid = LOUPE_EDGE / 2;
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  context.strokeRect(mid - 2.5, mid - 2.5, 5, 5);
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  context.strokeRect(mid - 1.5, mid - 1.5, 3, 3);
}

export default function Record() {
  const router = useRouter();
  const photoRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<ImageData | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);

  const [photo, setPhoto] = useState('');
  const photoBlobRef = useRef<Blob | null>(null);
  // 담기를 누르는 순간 올리기를 시작한다. 잉크가 번지는 동안 함께 흘러서,
  // 번짐이 끝날 즈음이면 대개 올라가 있다.
  const savingRef = useRef<Promise<void> | null>(null);
  const [color, setColor] = useState(FALLBACK_COLOR);
  const [memo, setMemo] = useState('');
  const [picking, setPicking] = useState(false);
  const [ink, setInk] = useState('');
  const [spread, setSpread] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  // 평균색을 그대로 둔 사람과 직접 집은 사람은 다른 행동을 한 것이다.
  const pickedByHandRef = useRef(false);

  useEffect(() => {
    const box = photoRef.current;
    const bitmap = bitmapRef.current;
    if (!photo || !box || !bitmap) return;

    const { width, height } = box.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const rect = coverRect(bitmap, { width, height });
    context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    pixelsRef.current = pixels;
    sourceRef.current = canvas;
    const average = averageColor(pixels.data);
    setColor(average ? rgbToHex(average) : FALLBACK_COLOR);
  }, [photo]);

  useEffect(() => {
    track(EVENT.recordOpened);
  }, []);

  useEffect(() => () => bitmapRef.current?.close(), []);

  // 미리보기로 만든 주소는 우리가 놓아 주어야 메모리에서 사라진다.
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo);
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
    const at = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const picked = pixelAt(pixels.data, pixels.width, at.x, at.y);
    if (!picked) return;

    // 돋보기는 손가락을 따라 매 프레임 움직인다. 상태로 올리면 문지르는 내내
    // 리렌더가 걸려 따라오는 게 늦는다. 여기서만 직접 그린다.
    drawLoupe(loupeRef.current, sourceRef.current, at);
    // 사진 위쪽을 문지를 때 화면 밖으로 나가지 않게 붙잡는다.
    const lifted = Math.max(LOUPE_EDGE, event.clientY - LOUPE_LIFT);
    loupeRef.current?.style.setProperty(
      'transform',
      `translate(${event.clientX}px, ${lifted}px) translate(-50%, -50%)`
    );

    const next = rgbToHex(picked);
    pickedByHandRef.current = true;
    setColor((current) => {
      if (current !== next) requestHaptic('selection');
      return next;
    });
  }, []);

  const save = async (chosen: string) => {
    const blob = photoBlobRef.current;
    if (blob === null) throw new Error('사진이 없다');

    const ticket = await requestUploadUrl({
      contentType: blob.type,
      contentLength: blob.size,
    });
    await uploadPhoto(ticket.uploadUrl, blob);
    await keepEntry({
      date: toDateKey(new Date()),
      color: chosen,
      photoKey: ticket.photoKey,
      memo: memo.trim() || undefined,
    });
  };

  const start = () => {
    setError('');
    track(EVENT.colorPicked, { by_hand: pickedByHandRef.current, ...memoShape(memo) });
    savingRef.current = save(color);
    setInk(color);
  };

  /** 잉크가 화면을 덮은 뒤에 넘어간다. 올리다 실패하면 번짐을 되돌린다. */
  const commit = () => {
    void savingRef.current
      ?.then(() => {
        track(EVENT.entryKept, { by_hand: pickedByHandRef.current, ...memoShape(memo) });
        router.replace('/#today');
      })
      .catch((failure: unknown) => {
        track(EVENT.entryFailed, {
          reason: isApiError(failure) ? failure.code : 'unknown',
        });
        setInk('');
        setSpread(false);
        setError(
          isApiError(failure)
            ? failure.message
            : '담지 못했어요. 잠시 뒤에 다시 시도해 주세요.'
        );
      });
  };

  return (
    <main
      css={css`
        display: flex;
        height: 100%;
        flex-direction: column;
        padding: 4.5rem var(--space-edge) 0;
      `}
    >
      {/* 사진을 고른 뒤에 받으면 정작 기다리는 동안 안 보인다. 화면에 들어올 때 미리 받는다. */}
      <link rel="preload" as="image" href="/loading-capsule.webp" />

      {photo ? (
        <>
          <div
            ref={photoRef}
            onPointerDown={(e) => {
              // 잡아두지 않으면 iOS 가 드래그를 자기 제스처로 가져가면서 pointermove 가 끊긴다.
              e.currentTarget.setPointerCapture(e.pointerId);
              setPicking(true);
              pick(e);
            }}
            onPointerMove={(e) => picking && pick(e)}
            onPointerUp={() => setPicking(false)}
            onPointerCancel={() => setPicking(false)}
            css={[
              frameStyle,
              css`
                touch-action: none;
              `,
            ]}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="ph-no-capture"
              src={photo}
              alt="오늘 담은 사진"
              css={css`
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
                animation: settle var(--duration-slow) var(--ease-out-expo) both;

                @keyframes settle {
                  from {
                    opacity: 0;
                    transform: scale(1.02);
                  }
                }
              `}
            />
          </div>

          <canvas
            ref={loupeRef}
            width={LOUPE_EDGE}
            height={LOUPE_EDGE}
            aria-hidden
            css={loupeStyle}
            style={{ opacity: picking ? 1 : 0 }}
          />

          <p css={hintStyle} style={{ opacity: picking ? 0 : 1 }}>
            사진을 문질러 오늘의 색을 고르세요
          </p>

          <input
            className="ph-no-capture"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="이 색에 담을 한 줄"
            css={memoStyle}
          />

          <button
            type="button"
            onClick={start}
            css={css`
              margin-bottom: 2rem;
              padding: 1.125rem;
              border: none;
              border-radius: var(--radius-pill);
              color: var(--color-background);
              font: inherit;
              font-weight: 400;
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
        <>
          <label css={[frameStyle, pickTargetStyle]}>
            <span
              css={css`
                font-size: 1.75rem;
                font-weight: 400;
                letter-spacing: -0.01em;
              `}
            >
              오늘의 사진 한 장
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setError('');
                setReading(true);
                try {
                  const bitmap = await createImageBitmap(file);
                  bitmapRef.current?.close();
                  bitmapRef.current = bitmap;

                  const blob = await toStoredPhoto(bitmap);
                  if (blob === null) throw new Error('사진을 만들지 못했다');
                  photoBlobRef.current = blob;
                  setPhoto(URL.createObjectURL(blob));
                  track(EVENT.photoPicked, { bytes: blob.size });
                } catch {
                  track(EVENT.photoPicked, { failed: true });
                  setError('사진을 읽지 못했어요. 다른 사진을 골라 주세요.');
                } finally {
                  setReading(false);
                }
              }}
              css={hiddenInputStyle}
            />
          </label>

          <p css={hintStyle}>찍거나 앨범에서 고르세요</p>
        </>
      )}

      {error && (
        <p
          css={css`
            margin: 0 0 1rem;
            text-align: center;
            font-size: 0.875rem;
            color: var(--color-alert);
          `}
        >
          {error}
        </p>
      )}

      {reading && <LoadingCapsule label="사진을 읽고 있어요" />}

      {ink && (
        <div
          onTransitionEnd={commit}
          css={css`
            position: fixed;
            /* 양모 테두리(body::before, z-index 10) 위로 번진다. 아래에 두면
               색이 화면을 덮는 순간에도 테두리만 남아 덜 덮인 것처럼 보인다. */
            z-index: 30;
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

/* 사진이 들어올 자리. 빈 상태도 같은 틀을 그대로 쓰므로, 사진을 고르는 순간
   화면이 다시 짜이지 않고 그 자리에 채워진다. */
const frameStyle = css`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-faint);
`;

/* 빈 면은 눌리는 것으로 안 읽힌다. 위가 짙은 안쪽 그늘을 넣어 무언가를 넣는 홈으로
   보이게 한다. 위가 짙은 건 빛이 위에서 오기 때문이고, 방울 음영과 같은 방향이다. */
const pickTargetStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: inset 0 0.125rem 0.75rem
    oklch(from var(--color-faint) calc(l - 0.14) c h);
  transition: transform var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover {
      background: oklch(from var(--color-faint) calc(l - 0.03) c h);
    }
  }

  &:active {
    transform: scale(0.985);
  }

  &:has(input:focus-visible) {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.4rem;
  }
`;

/* display: none 이면 접근성 트리에서도 빠져 보이스오버가 앨범을 열 수 없다. */
const hiddenInputStyle = css`
  position: absolute;
  width: 0.0625rem;
  height: 0.0625rem;
  opacity: 0;
`;

const hintStyle = css`
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  color: var(--color-muted);
  transition: opacity var(--duration-fast);
`;

const memoStyle = css`
  margin: auto 0 1.5rem;
  padding: 1rem 0;
  border: none;
  border-bottom: 0.0625rem solid var(--color-faint);
  background: none;
  color: inherit;
  font: inherit;
  outline: none;
  transition: border-color var(--duration-fast) linear;

  &::placeholder {
    color: var(--color-muted);
  }

  @media (hover: hover) {
    &:hover {
      border-bottom-color: var(--color-muted);
    }
  }

  &:focus {
    border-bottom-color: var(--color-foreground);
  }
`;

const loupeStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 5.25rem;
  height: 5.25rem;
  border: 0.1875rem solid var(--color-background);
  border-radius: var(--radius-pill);
  box-shadow: 0 0.4rem 1rem -0.2rem oklch(from var(--color-foreground) l c h / 0.3);
  background: var(--color-faint);
  image-rendering: pixelated;
  pointer-events: none;
  transition: opacity var(--duration-fast) linear;
`;
