/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiaryPage, NewItem } from '@/lib/api/diary';
import { subscribeToNative } from '@/lib/bridge';
import { unplacedPhotos } from '@/lib/diary';
import { SHELF } from '@/lib/query-keys';
import useEntries from '../use-entries';
import useFocusReload from '../use-focus-reload';
import Editor from './editor';
import { loadPhotos, type Images } from './page-art';
import Shelf from './shelf';
import StickerSheet from './sticker-sheet';
import { useDiary, useOpenYear, useShelf } from './use-diary';

/* three.js 는 책을 펼칠 때만 내려받는다. 책장만 보는 동안은 얹히지 않는다. */
const Book = dynamic(() => import('./book'), { ssr: false });

const COVERS = ['#F6C1CC', '#9CC3EF', '#9FD3B5', '#F6CF7A', '#C9A7E8', '#F5B48A'];
const NOTICE_MS = 2400;

type View = { kind: 'shelf' } | { kind: 'book'; id: number } | { kind: 'edit'; id: number; side: number };

const pill = css`
  padding: 0.5rem 1.25rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-faint);
  color: var(--color-foreground);
  transition: transform var(--duration-fast) var(--ease-out-expo);
  &:active { transform: scale(0.95); }
`;

function useFont(): string | null {
  const [font, setFont] = useState<string | null>(null);
  useEffect(() => {
    /* 캔버스에 글씨를 그릴 때 폰트가 아직 없으면 시스템 폰트로 굳어 버린다. */
    void document.fonts.ready.then(() => setFont(getComputedStyle(document.body).fontFamily));
  }, []);
  return font;
}

function useImages(pages: readonly DiaryPage[] | null): Images {
  const [images, setImages] = useState<Images>(new Map());
  useEffect(() => {
    if (!pages) return undefined;
    let gone = false;
    void loadPhotos(pages).then((loaded) => {
      if (!gone) setImages(loaded);
    });
    return () => {
      gone = true;
    };
  }, [pages]);
  return images;
}

/* 새로 붙인 것은 가운데쯤 살짝 기울여 놓는다. 똑바로 놓이면 손으로 붙인 느낌이 없다. */
const dropped = () => ({ x: 0.5, y: 0.45, scale: 1, rotation: (Math.random() - 0.5) * 0.16 });

export default function DiaryScreen() {
  const [view, setView] = useState<View>({ kind: 'shelf' });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  /* 책마다 펼쳐 둔 장 수. 꾸미고 돌아오거나 페이지가 늘어도 그 자리로 돌아온다. */
  const turned = useRef(new Map<number, { current: number }>());
  const thisYear = new Date().getFullYear();
  const font = useFont();
  const { books } = useShelf();
  const openYear = useOpenYear();
  const diaryId = view.kind === 'shelf' ? null : view.id;
  const conflict = useCallback(() => setNotice('그사이 다른 사람이 먼저 고쳤어요'), []);
  const { diary, place, remove, add, newPage, recolor } = useDiary(diaryId, conflict);
  const images = useImages(diary?.pages ?? null);
  const client = useQueryClient();
  /* 상대가 그사이 붙인 것도 보이게, 책장과 펼친 책을 함께 다시 읽는다. */
  useFocusReload(useCallback(() => void client.invalidateQueries({ queryKey: SHELF }), [client]));

  /* 양모 테두리는 다른 탭의 것이다. 이 탭은 책이 화면을 다 쓴다. */
  useEffect(() => {
    document.body.dataset.frame = 'off';
    return () => {
      delete document.body.dataset.frame;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const year = diary?.book.year ?? thisYear;
  const { entries } = useEntries({ from: `${year}-01-01`, to: `${year}-12-31` }, diary?.book.shared ? 'BOTH' : 'MINE');
  const photos = useMemo(() => (entries && diary
    ? unplacedPhotos(entries, diary.pages.flatMap((page) => page.items.map((item) => item.entryId)))
    : null), [entries, diary]);

  const turnedFor = useCallback((id: number) => {
    if (!turned.current.has(id)) turned.current.set(id, { current: 0 });
    return turned.current.get(id) as { current: number };
  }, []);

  const open = useCallback(async (opening: number) => {
    try {
      const opened = await openYear(opening);
      setView({ kind: 'book', id: opened.id });
    } catch {
      setNotice('책을 펼치지 못했어요');
    }
  }, [openYear]);

  /** 빈 면을 누르면 새 페이지를 만들고 그 페이지를 꾸민다. */
  const edit = useCallback(async (side: number) => {
    if (view.kind === 'shelf' || !diary) return;
    if (side >= diary.pages.length && !(await newPage())) return;
    setView({ kind: 'edit', id: view.id, side: Math.min(side, diary.pages.length) });
  }, [diary, newPage, view]);

  /* + 는 눌렸다는 것만 온다. 무엇을 더할지는 지금 화면이 정한다. */
  useEffect(() => subscribeToNative((message) => {
    if (message.type !== 'MENU' || (message.payload as { action?: string } | undefined)?.action !== 'add') return;
    if (view.kind === 'shelf') void open(thisYear);
    else if (view.kind === 'edit') setSheetOpen(true);
    else void edit(Math.max(0, (turnedFor(view.id).current - 1) * 2));
  }), [edit, open, thisYear, turnedFor, view]);

  const page = view.kind === 'edit' ? diary?.pages[view.side] ?? null : null;

  const attach = async (item: NewItem) => {
    if (!page) return;
    setSheetOpen(false);
    const saved = await add(page.id, item);
    if (saved) setFresh(saved.id);
  };

  return (
    <main
      css={css`
        /* 앱의 헤더는 투명하게 위를 덮고 터치도 가져간다. 그 아래에만 누를 것을 둔다. */
        --native-header: 2.75rem;
        position: relative;
        height: 100%;
        background: var(--color-background);
      `}
    >
      {view.kind === 'shelf' && books && <Shelf books={books} thisYear={thisYear} onOpen={(chosen) => void open(chosen)} />}

      {view.kind === 'book' && diary && font && (
        <>
          <Book book={diary.book} pages={diary.pages} images={images} turnedRef={turnedFor(view.id)} onEdit={(side) => void edit(side)} />
          <button type="button" css={[pill, css`position: absolute; top: calc(var(--native-header) + 0.75rem); left: 1rem;`]} onClick={() => setView({ kind: 'shelf' })}>
            책장
          </button>
          <div role="radiogroup" aria-label="표지 색" css={css`position: absolute; bottom: 1.5rem; inset-inline: 0; display: flex; justify-content: center; gap: 0.75rem;`}>
            {COVERS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={diary.book.coverColor === color}
                aria-label={color}
                onClick={() => void recolor(color)}
                css={css`
                  width: 1.75rem;
                  height: 1.75rem;
                  border: 0.1875rem solid ${diary.book.coverColor === color ? 'var(--color-foreground)' : 'transparent'};
                  border-radius: var(--radius-pill);
                  background: ${color};
                  transition: transform var(--duration-fast) var(--ease-out-expo);
                  &:active { transform: scale(0.9); }
                `}
              />
            ))}
          </div>
        </>
      )}

      {view.kind === 'edit' && page && font && (
        <>
          <Editor
            page={page}
            images={images}
            font={font}
            fresh={fresh}
            onPlace={(item) => void place(page.id, item)}
            onRemove={(id) => void remove(id)}
            onDone={() => setView({ kind: 'book', id: view.id })}
          />
          <StickerSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            photos={photos}
            onPhoto={(entryId, frame) => void attach({ kind: 'PHOTO', entryId, frame, ...dropped() })}
            onSticker={(sticker) => void attach({ kind: 'STICKER', sticker, ...dropped() })}
            onText={(text) => void attach({ kind: 'TEXT', text, ...dropped() })}
          />
        </>
      )}

      {notice && (
        <p role="status" css={css`position: absolute; top: calc(var(--native-header) + 3.5rem); inset-inline: 0; text-align: center; color: var(--color-alert);`}>
          {notice}
        </p>
      )}
    </main>
  );
}
