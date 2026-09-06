import assert from 'node:assert/strict';
import test from 'node:test';
import { HTTPError } from 'ky';
import { asApiError } from './client';
import { UNREADABLE } from './errors';

/** ky 가 미리 읽어 둔 본문. 실제 HTTPError 의 모양만 흉내낸다. */
function httpError(status: number, data: unknown): HTTPError {
  return Object.assign(Object.create(HTTPError.prototype), {
    response: { status },
    data,
  }) as HTTPError;
}

test('서버가 보낸 코드와 문구를 그대로 살린다', () => {
  // ky 2 는 본문을 먼저 읽어 data 에 담는다. response.json() 을 다시 부르면
  // 이미 읽혔다며 실패해서, 서버 문구가 통째로 사라진 적이 있다.
  const error = asApiError(httpError(409, { code: 'ALREADY_IN_ROOM', message: '이미 방에 있어요' }));

  assert.equal(error.code, 'ALREADY_IN_ROOM');
  assert.equal(error.message, '이미 방에 있어요');
  assert.equal(error.status, 409);
});

test('본문이 봉투가 아니면 우리 문구로 답한다', () => {
  assert.equal(asApiError(httpError(502, '<html>bad gateway</html>')).code, UNREADABLE);
  assert.equal(asApiError(httpError(500, undefined)).code, UNREADABLE);
});

test('HTTP 가 아닌 실패는 연결 문제로 본다', () => {
  assert.equal(asApiError(new TypeError('network')).code, 'OFFLINE');
});
