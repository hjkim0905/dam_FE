/**
 * 담기를 마친 직후가 이 앱이 가장 좋게 느껴지는 순간이다. 별점을 묻는다면
 * 거기뿐이다.
 *
 * 다만 첫날에 물으면 판단할 것이 없다. 며칠은 쌓여야 색이 나란히 놓인 모습이
 * 보이고, 그제서야 이 앱이 무엇인지 알게 된다.
 */
const MILESTONES = [3, 10, 30];

export function shouldAskForReview(keptCount: number): boolean {
  return MILESTONES.includes(keptCount);
}
