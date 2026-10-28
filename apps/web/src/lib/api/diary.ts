import { call } from './client';
import type { Placement } from '../diary';

export type Book = {
  id: number;
  year: number;
  coverColor: string;
  /** 방의 둘이 함께 꾸미는 책 */
  shared: boolean;
  pageCount: number;
};

export type ItemKind = 'PHOTO' | 'STICKER' | 'TEXT';

export type DiaryItem = Placement & {
  id: number;
  kind: ItemKind;
  entryId: number | null;
  photoUrl: string | null;
  /** 사진이면 그 기록의 날짜. 사진에 날짜가 따라붙는다. */
  date: string | null;
  color: string | null;
  sticker: string | null;
  frame: string | null;
  text: string | null;
  layer: number;
  version: number;
  createdBy: number;
};

export type DiaryPage = { id: number; position: number; items: DiaryItem[] };

export type Pages = { book: Book; pages: DiaryPage[] };

export type NewItem = Placement &
  (
    | { kind: 'PHOTO'; entryId: number; frame?: string }
    | { kind: 'STICKER'; sticker: string }
    | { kind: 'TEXT'; text: string }
  );

export async function fetchShelf(): Promise<Book[]> {
  const { books } = await call<{ books: Book[] }>('get', 'diaries');
  return books;
}

/** 그 해의 책을 펼친다. 없으면 서버가 만든다. 몇 번 불러도 한 권이다. */
export function openDiary(year: number): Promise<Book> {
  return call<Book>('post', 'diaries', { json: { year } });
}

export function recolorDiary(id: number, coverColor: string): Promise<Book> {
  return call<Book>('patch', `diaries/${id}`, { json: { coverColor } });
}

export function fetchPages(diaryId: number): Promise<Pages> {
  return call<Pages>('get', `diaries/${diaryId}/pages`);
}

export function addPage(diaryId: number): Promise<DiaryPage> {
  return call<DiaryPage>('post', `diaries/${diaryId}/pages`);
}

export function removePage(pageId: number): Promise<void> {
  return call<void>('delete', `diary-pages/${pageId}`);
}

export function addItem(pageId: number, item: NewItem): Promise<DiaryItem> {
  return call<DiaryItem>('post', `diary-pages/${pageId}/items`, { json: item });
}

/** version 은 고치기 전에 들고 있던 것. 그사이 상대가 고쳤으면 409 가 온다. */
export function moveItem(
  item: Pick<DiaryItem, 'id' | 'x' | 'y' | 'scale' | 'rotation' | 'layer' | 'version'> & { text?: string }
): Promise<DiaryItem> {
  const { id, ...body } = item;
  return call<DiaryItem>('patch', `diary-items/${id}`, { json: body });
}

export function removeItem(id: number): Promise<void> {
  return call<void>('delete', `diary-items/${id}`);
}
