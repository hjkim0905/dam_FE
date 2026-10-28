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
