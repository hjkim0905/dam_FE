export type Fold = {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly radius: number;
};

export type Size = { readonly width: number; readonly height: number };

export type Point = { readonly x: number; readonly y: number };

export type Point3 = readonly [number, number, number];

const EPSILON = 1e-9;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * 접힘선 너머의 종이를 반지름 radius 인 원통에 감는다. 종이 위에서 잰 거리를 원통의
 * 호 길이로 옮기므로 구부려도 종이가 늘어나거나 줄지 않는다. 반 바퀴를 넘어선 부분은
 * 원통 위에 뒤집혀 평평하게 눕는다. angle 은 접힘선 법선의 방향이다.
 */
export function bend(px: number, py: number, fold: Fold): Point3 {
  const nx = Math.cos(fold.angle);
  const ny = Math.sin(fold.angle);
  const s = (px - fold.x) * nx + (py - fold.y) * ny;
  if (s <= 0) return [px, py, 0];

  const bx = px - nx * s;
  const by = py - ny * s;
  const { radius } = fold;
  if (radius <= 0) return [bx - nx * s, by - ny * s, 0];

  const arc = Math.PI * radius;
  if (s >= arc) {
    const back = s - arc;
    return [bx - nx * back, by - ny * back, 2 * radius];
  }

  const phi = s / radius;
  const lift = radius * Math.sin(phi);
  return [bx + nx * lift, by + ny * lift, radius * (1 - Math.cos(phi))];
}

/**
 * 그 점이 왼쪽 더미로 얼마나 넘어갔는지. 0 은 아직 오른쪽에 누운 자리, 1 은 원통을 다 돌아
 * 왼쪽에 누운 자리다. 종이 전체를 한 높이로 옮기면 덜 넘긴 쪽이 아래 묶음 속으로 가라앉는다.
 */
export function turnedShare(px: number, py: number, fold: Fold): number {
  const s = (px - fold.x) * Math.cos(fold.angle) + (py - fold.y) * Math.sin(fold.angle);
  if (s <= 0) return 0;
  const arc = Math.PI * fold.radius;
  return arc <= 0 || s >= arc ? 1 : s / arc;
}

/**
 * 원통에 감긴 길이 a 의 점이 접힘선에서 얼마나 떨어져 보이는지(위에서 본 거리)를 뺀 값.
 * a - R sin(a/R) 이 끈 거리와 같아지는 a 를 찾는다. 0 에서 기울기가 0 이라 뉴턴법은
 * 처음 몇 픽셀을 끌 때 흔들려서 이분법을 쓴다.
 */
function wrapFor(distance: number, radius: number): number {
  let low = 0;
  let high = Math.PI * radius;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (mid - radius * Math.sin(mid / radius) < distance) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * 잡은 점이 손가락 바로 위에 오도록 접힘선을 놓는다. 원통 반 바퀴보다 덜 끌었으면
 * 잡은 점은 아직 원통 위에 있어서, 가장자리가 먼저 들리고 뒷면은 끌수록 드러난다.
 * 더 끌면 잡은 점이 원통을 넘어 뒤집혀 눕는다. 원통을 끈 거리에 맞춰 줄이면 손을
 * 대자마자 가장자리가 뒤집혀 뒷면부터 보인다.
 */
export function foldFromDrag(grab: Point, finger: Point, radius: number): Fold | null {
  const dx = finger.x - grab.x;
  const dy = finger.y - grab.y;
  const distance = Math.hypot(dx, dy);
  if (distance < EPSILON) return null;

  const nx = -dx / distance;
  const ny = -dy / distance;
  const half = Math.PI * radius;
  const reach = radius <= 0 || distance >= half ? (distance + half) / 2 : wrapFor(distance, radius);
  return { x: grab.x - nx * reach, y: grab.y - ny * reach, angle: Math.atan2(ny, nx), radius };
}

const distanceTo = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

const within = (point: Point, center: Point, radius: number): boolean =>
  distanceTo(point, center) <= radius + EPSILON;

function ontoCircle(point: Point, center: Point, radius: number): Point {
  if (within(point, center, radius)) return point;
  const scale = radius / distanceTo(point, center);
  return { x: center.x + (point.x - center.x) * scale, y: center.y + (point.y - center.y) * scale };
}

/**
 * 페이지는 책등에 묶여 있어서, 잡은 점이 책등 위아래 모서리에서 원래보다 멀어질 수
 * 없다. 두 원이 겹친 안쪽에서 손가락에 가장 가까운 점을 돌려준다. 이것을 안 막으면
 * 페이지가 책등에서 떨어져 나간 것처럼 늘어난다.
 */
export function constrainToSpine(grab: Point, finger: Point, page: Size): Point {
  const top: Point = { x: 0, y: page.height };
  const bottom: Point = { x: 0, y: 0 };
  const toBottom = distanceTo(grab, bottom);
  const toTop = distanceTo(grab, top);

  const pulledToBottom = ontoCircle(finger, bottom, toBottom);
  if (within(pulledToBottom, top, toTop)) return pulledToBottom;
  const pulledToTop = ontoCircle(finger, top, toTop);
  if (within(pulledToTop, bottom, toBottom)) return pulledToTop;

  const y = (toBottom ** 2 - toTop ** 2 + page.height ** 2) / (2 * page.height);
  const x = Math.sqrt(Math.max(0, toBottom ** 2 - y ** 2));
  return distanceTo({ x, y }, finger) <= distanceTo({ x: -x, y }, finger) ? { x, y } : { x: -x, y };
}

/** 잡은 점이 책등 건너편의 거울 자리까지 얼마나 갔는가. */
export function turnProgress(grab: Point, finger: Point): number {
  return clamp01((grab.x - finger.x) / (2 * grab.x));
}

/**
 * 손에 든 스티커처럼 잡은 쪽만 살짝 들린 모양. foldFromDrag 는 잡은 점을 손가락 위로
 * 완전히 뒤집어 버려서, 떼어 든 뒤에 쓰면 스티커가 반으로 접힌 덮개처럼 보인다.
 * direction 은 잡은 점이 들리는 쪽(단위 벡터), sweep 은 원통을 감는 각도다.
 */
export function curlAt(grab: Point, direction: Point, radius: number, sweep: number): Fold {
  const reach = radius * sweep;
  return {
    x: grab.x - direction.x * reach,
    y: grab.y - direction.y * reach,
    angle: Math.atan2(direction.y, direction.x),
    radius,
  };
}

/**
 * 용수철은 목표를 살짝 지나친다. 가장자리 바깥으로 지나치면 접힘이 페이지 전체를
 * 뒤집고, 거울 자리를 지나치면 페이지가 책등 너머로 밀려난다. 그리기 전에만 붙잡는다.
 */
export function clampToTurn(grab: Point, finger: Point): Point {
  return { x: Math.min(grab.x, Math.max(-grab.x, finger.x)), y: finger.y };
}
