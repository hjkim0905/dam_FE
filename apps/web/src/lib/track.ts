import posthog from 'posthog-js';

/**
 * 화면이 posthog 를 직접 부르지 않게 한 겹 둔다. 키가 없는 환경(로컬, CI, PR
 * 미리보기)에서는 SDK 가 아예 안 뜨는데, 그때마다 화면이 그것을 알아야 하면
 * 이벤트를 심는 자리마다 조건문이 붙는다.
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

/**
 * 로그인한 사람을 서버 id 로 붙인다. 방은 그룹으로 함께 묶는다. 담은 둘이 한 방을
 * 채우는 서비스라, 사람 단위로만 보면 방에 대해 물어볼 수가 없다.
 */
export function identify(
  id: string,
  properties: Record<string, unknown>,
  room: { key: string; properties: Record<string, unknown> } | null
): void {
  if (!posthog.__loaded) return;

  posthog.identify(id, properties);
  if (room) posthog.group('room', room.key, room.properties);
}

/** 로그아웃하면 다음 사람의 이벤트가 앞사람에게 붙지 않도록 끊는다. */
export function forget(): void {
  if (!posthog.__loaded) return;
  posthog.reset();
}
