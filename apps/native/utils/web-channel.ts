import type { MenuAction } from "./menu";
/**
 * 헤더의 메뉴는 웹뷰 바깥에 있어서 그 ref 에 닿지 못한다. 지금 보고 있는 웹뷰가
 * 자기 자신을 여기에 걸어두면, 메뉴는 누가 떠 있는지 모른 채 말만 걸면 된다.
 *
 * 탭마다 웹뷰가 따로 살아 있으므로 걸리는 것은 언제나 앞에 나와 있는 하나다.
 */
type Post = (message: string) => void;

let current: Post | null = null;

export function holdWeb(post: Post | null): void {
  current = post;
}


export function sendToWeb(action: MenuAction): void {
  current?.(JSON.stringify({ type: "MENU", payload: { action } }));
}

/*
 * 다꾸 탭 헤더의 왼쪽 버튼 이름. 웹이 화면을 바꿀 때마다 알려 준다. 헤더는 웹뷰 바깥이라
 * 여기 두고, 헤더가 구독해서 다시 그린다.
 */
let diaryBackLabel: string | null = null;
const diaryBackListeners = new Set<() => void>();

export function setDiaryBack(label: string | null): void {
  diaryBackLabel = label;
  diaryBackListeners.forEach((listener) => listener());
}

export function subscribeDiaryBack(listener: () => void): () => void {
  diaryBackListeners.add(listener);
  return () => diaryBackListeners.delete(listener);
}

export const currentDiaryBack = (): string | null => diaryBackLabel;
