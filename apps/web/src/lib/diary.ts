export type Placement = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rotation: number;
};

export type Point = { readonly x: number; readonly y: number };

export type Transform = { readonly dx: number; readonly dy: number; readonly scale: number; readonly rotation: number };

/* 서버(Placement.java)와 같은 한도다. 다르면 화면이 먼저 그린 자리와 서버가 저장한
   자리가 달라져, 다시 읽는 순간 스티커가 튄다. */
const MIN_POSITION = -0.25;
const MAX_POSITION = 1.25;
const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
/* 두 손가락이 이보다 가까우면 둘 사이 거리로 나누는 배율이 터진다. */
const MIN_SPAN = 1e-6;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function wrap(angle: number): number {
  const turned = angle % (2 * Math.PI);
  if (turned > Math.PI) return turned - 2 * Math.PI;
  if (turned <= -Math.PI) return turned + 2 * Math.PI;
  return turned;
}

export function clampPlacement({ x, y, scale, rotation }: Placement): Placement {
  return {
    x: clamp(x, MIN_POSITION, MAX_POSITION),
    y: clamp(y, MIN_POSITION, MAX_POSITION),
    scale: clamp(scale, MIN_SCALE, MAX_SCALE),
    rotation: wrap(rotation),
  };
}

const midpoint = (points: readonly Point[]): Point => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

/**
 * 처음 닿은 손가락들과 지금 손가락들로 옮김, 배율, 회전을 구한다. 옮김은 두 손가락의
 * 가운데가 움직인 만큼이라, 벌리기만 하면 제자리에서 커진다.
 */
export function twoFingerTransform(start: readonly Point[], now: readonly Point[]): Transform {
  const from = midpoint(start);
  const to = midpoint(now);
  const moved = { dx: to.x - from.x, dy: to.y - from.y };
  if (start.length < 2 || now.length < 2) return { ...moved, scale: 1, rotation: 0 };

  const before = { x: start[1].x - start[0].x, y: start[1].y - start[0].y };
  const after = { x: now[1].x - now[0].x, y: now[1].y - now[0].y };
  const span = Math.hypot(before.x, before.y);
  if (span < MIN_SPAN) return { ...moved, scale: 1, rotation: 0 };
  return {
    ...moved,
    scale: Math.hypot(after.x, after.y) / span,
    rotation: Math.atan2(after.y, after.x) - Math.atan2(before.y, before.x),
  };
}

/** 고른 것을 맨 위로 올린 새 배열. 이미 맨 위면 같은 배열을 돌려줘서 다시 그리지 않게 한다. */
export function bringToFront<T extends { readonly id: number; readonly layer: number }>(
  items: readonly T[],
  id: number
): readonly T[] {
  const top = Math.max(...items.map((item) => item.layer));
  const target = items.find((item) => item.id === id);
  if (!target || (target.layer === top && items.filter((item) => item.layer === top).length === 1)) return items;
  return items.map((item) => (item.id === id ? { ...item, layer: top + 1 } : item));
}

/** 바텀시트에는 이 책에 아직 안 붙인 사진만 보인다. 같은 사진을 두 번 붙이는 일은 드물다. */
export function unplacedPhotos<T extends { readonly id: number }>(
  entries: readonly T[],
  placed: readonly (number | null)[]
): readonly T[] {
  const used = new Set(placed.filter((id): id is number => id !== null));
  return entries.filter((entry) => !used.has(entry.id));
}

/** 사진 아래에 손글씨처럼 붙는 날짜. 해는 책 표지에 있으므로 뺀다. */
export function dateLabel(date: string | null): string {
  if (!date) return '';
  const [, month, day] = date.split('-');
  return `${month}.${day}`;
}

/** 책장에 꽂을 해. 올해 책은 아직 안 만들었어도 펼칠 수 있게 맨 앞에 자리를 둔다. */
export function shelfYears(made: readonly number[], thisYear: number): readonly number[] {
  return [...new Set([thisYear, ...made])].sort((a, b) => b - a);
}

type WithItems<I> = { readonly id: number; readonly items: readonly I[] };
type Book<P> = { readonly pages: readonly P[] };

/** 서버가 돌려준 것으로 캐시의 그것을 갈아 끼운다. 그 페이지에 없으면 맨 뒤에 붙인다. */
export function upsertItem<I extends { readonly id: number }, P extends WithItems<I>, B extends Book<P>>(
  book: B,
  pageId: number,
  item: I
): B {
  return {
    ...book,
    pages: book.pages.map((page) => {
      if (page.id !== pageId) return page;
      const exists = page.items.some((candidate) => candidate.id === item.id);
      return {
        ...page,
        items: exists ? page.items.map((candidate) => (candidate.id === item.id ? item : candidate)) : [...page.items, item],
      };
    }),
  };
}

export function dropItem<I extends { readonly id: number }, P extends WithItems<I>, B extends Book<P>>(book: B, id: number): B {
  return {
    ...book,
    pages: book.pages.map((page) => (page.items.some((item) => item.id === id)
      ? { ...page, items: page.items.filter((item) => item.id !== id) }
      : page)),
  };
}

export function appendPage<P, B extends Book<P>>(book: B, page: P): B {
  return { ...book, pages: [...book.pages, page] };
}

const CUTOUT = 'cutout';
const percent = (value: number): number => Math.round(Math.min(1, Math.max(0, value)) * 100);

/** 누끼 사진의 이름. 누른 자리를 퍼센트로 적어 두면 다시 열어도 같은 피사체를 딴다. */
export function cutoutFrame(point: Point): string {
  return `${CUTOUT}-${percent(point.x)}-${percent(point.y)}`;
}

/** 'cutout' 은 예전처럼 피사체를 모두, 'cutout-42-60' 은 그 자리의 피사체 하나다. */
export function cutoutPoint(frame: string | null): Point | 'whole' | null {
  if (frame === CUTOUT) return 'whole';
  const matched = frame?.match(/^cutout-(\d{1,3})-(\d{1,3})$/);
  return matched ? { x: Number(matched[1]) / 100, y: Number(matched[2]) / 100 } : null;
}

export type Square = { readonly x: number; readonly y: number; readonly size: number };

/**
 * 페이지 위 사진의 정사각형 칸 안에서 누른 자리를 원본 사진의 비율 좌표로 바꾼다.
 * 칸에는 원본의 가운데를 정사각형으로 잘라 넣었으므로 잘린 쪽을 되돌린다.
 */
export function pressedOnPhoto(local: Point, square: Square, natural: { width: number; height: number }): Point | null {
  const u = (local.x - square.x) / square.size;
  const v = (local.y - square.y) / square.size;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  const side = Math.min(natural.width, natural.height);
  return {
    x: ((natural.width - side) / 2 + u * side) / natural.width,
    y: ((natural.height - side) / 2 + v * side) / natural.height,
  };
}

/** 한 손가락으로 모서리 손잡이를 끌 때, 가운데를 축으로 한 배율과 회전. 같은 단위의 좌표여야 한다. */
export function pivotTransform(pivot: Point, from: Point, now: Point): { scale: number; rotation: number } {
  const before = Math.hypot(from.x - pivot.x, from.y - pivot.y);
  const after = Math.hypot(now.x - pivot.x, now.y - pivot.y);
  if (before < 1e-6 || after < 1e-6) return { scale: 1, rotation: 0 };
  const rotation = Math.atan2(now.y - pivot.y, now.x - pivot.x) - Math.atan2(from.y - pivot.y, from.x - pivot.x);
  return { scale: after / before, rotation: Math.atan2(Math.sin(rotation), Math.cos(rotation)) };
}
