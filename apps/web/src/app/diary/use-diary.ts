'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  addItem,
  addPage,
  fetchPages,
  fetchShelf,
  moveItem,
  openDiary,
  recolorDiary,
  removeItem,
  type DiaryItem,
  type DiaryPage,
  type NewItem,
  type Pages,
} from '@/lib/api/diary';
import { isApiError } from '@/lib/api/errors';
import { appendPage, dropItem, upsertItem } from '@/lib/diary';
import { pagesKey, SHELF } from '@/lib/query-keys';

export function useShelf() {
  const { data, isError } = useQuery({ queryKey: SHELF, queryFn: fetchShelf });
  return { books: data ?? null, failed: isError };
}

/**
 * 한 권의 페이지와 그 위를 고치는 일. 화면은 답을 기다리지 않고 먼저 움직인다. 실패하면
 * 서버를 다시 읽어 화면을 서버 상태로 되돌린다. 상대가 먼저 고친 409 도 같은 길이다.
 */
export function useDiary(diaryId: number | null, onConflict: () => void) {
  const client = useQueryClient();
  const key = pagesKey(diaryId ?? -1);
  const { data, isError } = useQuery({
    queryKey: key,
    queryFn: () => fetchPages(diaryId as number),
    enabled: diaryId !== null,
  });

  const edit = useCallback((change: (pages: Pages) => Pages) => {
    client.setQueryData<Pages>(key, (old) => (old ? change(old) : old));
  }, [client, key]);

  const resync = useCallback((error: unknown) => {
    if (isApiError(error) && error.status === 409) onConflict();
    void client.invalidateQueries({ queryKey: key });
  }, [client, key, onConflict]);

  const place = useCallback(async (pageId: number, item: DiaryItem) => {
    edit((pages) => upsertItem(pages, pageId, item));
    try {
      const { id, x, y, scale, rotation, layer, version } = item;
      const saved = await moveItem({ id, x, y, scale, rotation, layer, version });
      edit((pages) => upsertItem(pages, pageId, saved));
    } catch (error) {
      resync(error);
    }
  }, [edit, resync]);

  const remove = useCallback(async (id: number) => {
    edit((pages) => dropItem(pages, id));
    try {
      await removeItem(id);
    } catch (error) {
      resync(error);
    }
  }, [edit, resync]);

  const add = useCallback(async (pageId: number, item: NewItem): Promise<DiaryItem | null> => {
    try {
      const saved = await addItem(pageId, item);
      edit((pages) => upsertItem(pages, pageId, saved));
      return saved;
    } catch (error) {
      resync(error);
      return null;
    }
  }, [edit, resync]);

  const newPage = useCallback(async (): Promise<DiaryPage | null> => {
    if (diaryId === null) return null;
    try {
      const page = await addPage(diaryId);
      edit((pages) => appendPage(pages, page));
      void client.invalidateQueries({ queryKey: SHELF, exact: true });
      return page;
    } catch (error) {
      resync(error);
      return null;
    }
  }, [client, diaryId, edit, resync]);

  const recolor = useCallback(async (color: string) => {
    if (diaryId === null) return;
    const book = await recolorDiary(diaryId, color);
    edit((pages) => ({ ...pages, book }));
    void client.invalidateQueries({ queryKey: SHELF, exact: true });
  }, [client, diaryId, edit]);

  return { diary: data ?? null, failed: isError, place, remove, add, newPage, recolor };
}

export function useOpenYear() {
  const client = useQueryClient();
  return useCallback(async (year: number) => {
    const book = await openDiary(year);
    void client.invalidateQueries({ queryKey: SHELF, exact: true });
    return book;
  }, [client]);
}
