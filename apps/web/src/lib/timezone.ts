/**
 * 서버는 자기 시간대로 오늘을 잰다. 그러면 서버보다 앞선 곳에 있는 사람이
 * 자정을 넘긴 뒤 한동안 "아직 오지 않은 날"이라는 말을 듣는다. 어느 쪽으로
 * 맞추든 반대편이 막히므로, 그 사람이 선 자리를 알려 주는 수밖에 없다.
 */
export function currentZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}
