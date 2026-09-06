import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, hasCode, isApiError, readErrorBody, UNREADABLE } from './errors';

test('서버 봉투를 그대로 읽는다', () => {
  const error = readErrorBody({ code: 'INVITE_EXPIRED', message: '초대코드가 만료됐어요' }, 410);

  assert.equal(error.code, 'INVITE_EXPIRED');
  assert.equal(error.message, '초대코드가 만료됐어요');
  assert.equal(error.status, 410);
});

test('봉투가 아닌 응답에도 코드를 붙여 준다', () => {
  // 프록시나 게이트웨이가 HTML 오류 페이지를 돌려주는 일이 있다.
  const error = readErrorBody('<html>502</html>', 502);

  assert.equal(error.code, UNREADABLE);
  assert.equal(error.status, 502);
});

test('code 만 있고 message 가 없으면 우리 문장을 쓴다', () => {
  assert.equal(readErrorBody({ code: 'NOPE' }, 400).code, UNREADABLE);
});

test('hasCode 는 다른 예외에 흔들리지 않는다', () => {
  assert.equal(hasCode(new ApiError('ROOM_FULL', '방이 찼어요', 409), 'ROOM_FULL'), true);
  assert.equal(hasCode(new ApiError('ROOM_FULL', '방이 찼어요', 409), 'INVITE_USED'), false);
  assert.equal(hasCode(new TypeError('네트워크'), 'ROOM_FULL'), false);
  assert.equal(isApiError(new TypeError('네트워크')), false);
});
