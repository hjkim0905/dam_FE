/** 프레임 간격이 들쭉날쭉해도 같은 속도로 따라가도록 지수 감쇠로 다가간다. */
export function approach(current: number, target: number, seconds: number, rate: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * seconds));
}
