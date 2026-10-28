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
 * 잡은 점이 손가락 바로 위에 오도록 접힘선을 놓는다. 접힘선은 잡은 점에서 손가락
 * 쪽으로 (끈 거리 + 원통 반 바퀴) 의 절반만큼 들어간 자리다. 조금만 끌었을 때는
 * 원통을 끈 거리에 맞춰 줄여서, 손을 대자마자 종이가 툭 솟지 않게 한다.
 */
export function foldFromDrag(grab: Point, finger: Point, radius: number): Fold | null {
  const dx = finger.x - grab.x;
  const dy = finger.y - grab.y;
  const distance = Math.hypot(dx, dy);
  if (distance < EPSILON) return null;

  const nx = -dx / distance;
  const ny = -dy / distance;
  const r = Math.min(radius, distance / Math.PI);
  const reach = (distance + Math.PI * r) / 2;
  return { x: grab.x - nx * reach, y: grab.y - ny * reach, angle: Math.atan2(ny, nx), radius: r };
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
