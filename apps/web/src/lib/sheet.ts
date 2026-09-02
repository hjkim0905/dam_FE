const DISMISS_RATIO = 0.35;
const FLICK_SPEED = 0.5;
const MIN_SETTLE_MS = 120;
const MAX_SETTLE_MS = 420;

/**
 * 손을 뗀 순간 닫을지. 멀리 끌었거나, 조금 끌었어도 아래로 튕겼으면 닫는다.
 * 속도를 보지 않으면 짧고 빠른 손짓이 무시되어 시트가 손가락을 안 따라온 것처럼 느껴진다.
 */
export function shouldDismiss(
  offset: number,
  velocity: number,
  height: number
): boolean {
  if (velocity > FLICK_SPEED) return true;
  if (velocity < -FLICK_SPEED) return false;

  return offset > height * DISMISS_RATIO;
}

/**
 * 남은 거리를 손이 가던 속도로 이어서 마무리하는 시간.
 * 고정 시간으로 시작하면 빠르게 튕긴 뒤 갑자기 느려져 손과 화면이 끊긴다.
 */
export function settleDuration(distance: number, velocity: number): number {
  const speed = Math.abs(velocity);
  if (speed < 0.01) return MAX_SETTLE_MS;

  const ms = Math.abs(distance) / speed;
  return Math.max(MIN_SETTLE_MS, Math.min(ms, MAX_SETTLE_MS));
}

/** 끝을 넘겨 끌 때 붙는 저항. 위로는 밀리지 않는 것처럼 느껴져야 한다. */
export function rubberBand(offset: number): number {
  return offset >= 0 ? offset : -Math.log1p(-offset / 2) * 8;
}
