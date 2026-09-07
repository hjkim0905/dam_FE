/**
 * 오늘이 언제인지는 서버가 아니라 그 사람이 선 자리가 정한다. 서버가 그것을
 * 알려면 앱이 말해 주는 수밖에 없다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { currentZone } from './timezone';

test('currentZone 은 브라우저가 아는 시간대를 준다', () => {
  const zone = currentZone();

  assert.equal(typeof zone, 'string');
  assert.ok(zone.length > 0);
  // IANA 이름이라야 서버의 ZoneId 가 읽는다.
  assert.ok(zone.includes('/') || zone === 'UTC');
});

test('currentZone 은 Intl 이 없어도 터지지 않는다', () => {
  // 아주 오래된 웹뷰에서는 Intl 이 없을 수 있다. 시간대를 몰랐다고 요청 자체가
  // 실패해서는 안 된다.
  const saved = globalThis.Intl;
  try {
    // @ts-expect-error 없는 환경을 흉내낸다
    delete globalThis.Intl;
    assert.equal(currentZone(), '');
  } finally {
    globalThis.Intl = saved;
  }
});
