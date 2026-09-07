/**
 * 오류 보고에 실려 나가면 안 되는 것을 지우는 규칙.
 * 사진 주소의 쿼리에는 스토리지 서명이 들어 있어서, 그것만으로 사진이 열린다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { scrubUrl } from './sentry';

test('scrubUrl 은 사진 주소에서 서명을 지운다', () => {
  const signed =
    'https://axl.compat.objectstorage.ap-tokyo-1.oraclecloud.com/dam/7/a1b2' +
    '?X-Amz-Signature=deadbeef&X-Amz-Expires=518400';

  assert.equal(
    scrubUrl(signed),
    'https://axl.compat.objectstorage.ap-tokyo-1.oraclecloud.com/dam/7/a1b2'
  );
});

test('scrubUrl 은 어느 요청이 깨졌는지 알 수 있게 경로는 남긴다', () => {
  assert.equal(
    scrubUrl('https://dam.example/api/v1/entries?from=2026-09-01&to=2026-09-30'),
    'https://dam.example/api/v1/entries'
  );
});

test('scrubUrl 은 조각도 지운다', () => {
  assert.equal(scrubUrl('https://dam.example/room#token=abc'), 'https://dam.example/room');
});

test('scrubUrl 은 상대 주소를 그대로 다룬다', () => {
  assert.equal(scrubUrl('/api/v1/me?verbose=1'), '/api/v1/me');
});

test('scrubUrl 은 지울 것이 없으면 그대로 둔다', () => {
  assert.equal(scrubUrl('https://dam.example/api/v1/me'), 'https://dam.example/api/v1/me');
});

test('scrubUrl 은 주소가 아닌 값에도 터지지 않는다', () => {
  // breadcrumb 의 url 자리에 늘 주소가 오는 것은 아니다.
  assert.equal(scrubUrl(''), '');
  assert.equal(scrubUrl('about:blank'), 'about:blank');
});
