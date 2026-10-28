/** 프레임 간격이 들쭉날쭉해도 같은 속도로 따라가도록 지수 감쇠로 다가간다. */
export function approach(current: number, target: number, seconds: number, rate: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * seconds));
}

export type Spring = { readonly value: number; readonly velocity: number };

/* 놓은 종이가 펴지는 빠르기와 탄력. 감쇠비 0.82 면 1% 남짓만 지나쳤다 돌아온다.
   더 낮추면 고무처럼 튕기고, 1 로 올리면 다시 기계처럼 멈춘다. */
const FREQUENCY = 8;
const DAMPING_RATIO = 0.82;
/* 큰 간격을 한 번에 적분하면 튄다. 잘게 나눠서 밟는다. */
const MAX_STEP = 1 / 240;

/** 진동수와 감쇠비로 정한 용수철로 목표에 다가간다. */
export function spring(state: Spring, target: number, seconds: number): Spring {
  let { value, velocity } = state;
  const steps = Math.ceil(seconds / MAX_STEP);
  const h = steps > 0 ? seconds / steps : 0;
  for (let i = 0; i < steps; i += 1) {
    const acceleration = -(FREQUENCY ** 2) * (value - target) - 2 * DAMPING_RATIO * FREQUENCY * velocity;
    velocity += acceleration * h;
    value += velocity * h;
  }
  return { value, velocity };
}
