/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiaryItem, DiaryPage, NewItem } from '@/lib/api/diary';
import { requestHaptic, sendToNative, subscribeToNative } from '@/lib/bridge';
import { cutoutFrame, unplacedPhotos, type Point } from '@/lib/diary';
import { SHELF } from '@/lib/query-keys';
import useEntries from '../use-entries';
import useFocusReload from '../use-focus-reload';
import Editor from './editor';
import { HAND, loadHand } from './hand';
import { loadCutout, loadPhotos, type Images } from './page-art';
import Shelf from './shelf';
import StickerSheet from './sticker-sheet';
import { useDiary, useOpenYear, useShelf } from './use-diary';

/* three.js 는 책을 펼칠 때만 내려받는다. 책장만 보는 동안은 얹히지 않는다. */
const Book = dynamic(() => import('./book'), { ssr: false });

const NOTICE_MS = 2400;

const BACK_LABEL: Record<View['kind'], string | null> = { shelf: null, book: '책장', look: '닫기', edit: '완료' };

/* 다꾸는 책상 위에 펼친 책이다. 흰 화면이 아니라 따뜻한 책상 색을 깐다. */
const DESK = '#efe8dd';

/** 안전영역과 위아래 끝도 책상이어야 한다. main 만 칠하면 그 바깥이 흰 띠로 남는다. */
function useDeskBackground() {
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    const before = targets.map((element) => element.style.background);
    targets.forEach((element) => {
      element.style.background = DESK;
    });
    return () => targets.forEach((element, i) => {
      element.style.background = before[i];
    });
  }, []);
}

type View =
  | { kind: 'shelf' }
  | { kind: 'book'; id: number }
  | { kind: 'look'; id: number; side: number }
  | { kind: 'edit'; id: number; side: number };

function useFont(): string | null {
  const [font, setFont] = useState<string | null>(null);
  useEffect(() => {
    void loadHand().then(setFont);
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
  useDeskBackground();
  const { books } = useShelf();
  const openYear = useOpenYear();
  const diaryId = view.kind === 'shelf' ? null : view.id;
  const conflict = useCallback(() => setNotice('그사이 다른 사람이 먼저 고쳤어요'), []);
  const { diary, place, remove, add, newPage } = useDiary(diaryId, conflict);
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
  /* 왼쪽 버튼은 네이티브 헤더에 있다. 웹이 그리면 헤더가 그 자리 터치를 가져가 눌리지 않는다.
     이름만 알려 주고, 눌리면 어디로 갈지는 여기서 정한다. */
  useEffect(() => {
    sendToNative({ type: 'HEADER', payload: { back: BACK_LABEL[view.kind] } });
  }, [view.kind]);
  useEffect(() => () => sendToNative({ type: 'HEADER', payload: { back: null } }), []);

  useEffect(() => subscribeToNative((message) => {
    if (message.type !== 'MENU') return;
    const { action } = (message.payload as { action?: string } | undefined) ?? {};
    if (action === 'back') {
      if (view.kind === 'book') setView({ kind: 'shelf' });
      else if (view.kind !== 'shelf') setView({ kind: 'book', id: view.id });
      return;
    }
    if (action !== 'add') return;
    if (view.kind === 'shelf') void open(thisYear);
    else if (view.kind === 'edit') setSheetOpen(true);
    else if (view.kind === 'look') void edit(view.side);
    else void edit(Math.max(0, (turnedFor(view.id).current - 1) * 2));
  }), [edit, open, thisYear, turnedFor, view]);

  const page = view.kind === 'edit' ? diary?.pages[view.side] ?? null : null;
  /* 아직 없는 면은 빈 종이로 보여 준다. 페이지는 편집하기를 눌러야 생긴다. 보기만 해도 생기면 빈 장이 쌓인다. */
  const looked = view.kind === 'look' && diary
    ? diary.pages[view.side] ?? { id: -1, position: view.side, items: [] }
    : null;

  const attach = async (item: NewItem) => {
    if (!page) return;
    setSheetOpen(false);
    const saved = await add(page.id, item);
    if (saved) setFresh(saved.id);
  };

  /* 원래 사진은 그대로 두고 떼어 낸 피사체를 그 옆에 하나 더 붙인다. 사진 앱의 들어 올리기와 같다. */
  const lift = async (item: DiaryItem, point: Point) => {
    if (!page || item.entryId === null || !item.photoUrl) return;
    requestHaptic('medium');
    const frame = cutoutFrame(point);
    if (!(await loadCutout(item.entryId, item.photoUrl, frame))) {
      setNotice('여기서는 떼어 낼 것을 못 찾았어요');
      return;
    }
    await attach({ kind: 'PHOTO', entryId: item.entryId, frame, x: item.x + 0.06, y: item.y + 0.05, scale: item.scale, rotation: 0 });
  };

  return (
    <main
      css={css`
        /* 앱의 헤더는 투명하게 위를 덮고 터치도 가져간다. 그 아래에만 누를 것을 둔다. */
        /* main 은 상태 표시줄 아래에서 시작하고, 맨 위 44pt 는 네이티브 헤더가 덮고 터치도 가져간다. */
        --native-header: 2.75rem;
        --diary-desk: ${DESK};
        position: relative;
        font-family: ${HAND};
        font-size: 1.125rem;
        height: 100%;
        background: var(--diary-desk);
      `}
    >
      {view.kind === 'shelf' && books && <Shelf books={books} thisYear={thisYear} onOpen={(chosen) => void open(chosen)} />}

      {view.kind === 'book' && diary && font && (
        <>
          <Book book={diary.book} pages={diary.pages} images={images} turnedRef={turnedFor(view.id)} onEdit={(side) => setView({ kind: 'look', id: view.id, side })} />
        </>
      )}

      {view.kind === 'look' && looked && font && (
        <Editor
          page={looked}
          images={images}
          font={font}
          fresh={null}
          onPlace={() => {}}
          onRemove={() => {}}
          onLift={() => {}}
          onEdit={() => void edit(view.side)}
        />
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
            onLift={(item, point) => void lift(item, point)}
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
        <p role="status" css={css`position: absolute; top: calc(var(--native-header) + 0.75rem); inset-inline: 0; text-align: center; color: var(--color-alert);`}>
          {notice}
        </p>
      )}
    </main>
  );
}
