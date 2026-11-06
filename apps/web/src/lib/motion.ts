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

export type Sample = { readonly time: number; readonly x: number };

/* 손을 떼기 직전 이만큼의 움직임만 본다. 길면 오래전 움직임이 섞이고, 짧으면 이벤트가
   한두 개뿐이라 들쭉날쭉하다. 단위는 밀리초. */
const VELOCITY_WINDOW = 100;
const MIN_SPAN = 16;

/**
 * 최근 움직인 거리를 걸린 시간으로 나눈다. 이벤트 사이 간격으로 나누면 같은 순간에
 * 몰려 온 이벤트 하나가 속도를 수백 배로 튀게 해서, 살짝 놓아도 휙 튕긴 것이 된다.
 */
export function velocityOf(samples: readonly Sample[], now: number): number {
  const recent = samples.filter((sample) => now - sample.time <= VELOCITY_WINDOW);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const span = last.time - first.time;
  if (span < MIN_SPAN) return 0;
  return ((last.x - first.x) / span) * 1000;
}
