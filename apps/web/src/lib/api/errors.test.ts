import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiError,
  hasCode,
  isApiError,
  isSessionGone,
  needsUpdate,
  OFFLINE,
  readErrorBody,
  UNREADABLE,
} from './errors';

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

test('서버가 토큰을 거절했을 때만 세션을 버린다', () => {
  assert.equal(isSessionGone(new ApiError('UNAUTHENTICATED', '다시 로그인해 주세요', 401)), true);
});

test('연결이 끊긴 것은 세션과 상관없다', () => {
  // 여기서 참을 주면 비행기 모드로 앱을 연 사람이 로그아웃된다.
  assert.equal(isSessionGone(new ApiError(OFFLINE, '연결을 확인해 주세요', 0)), false);
});

test('읽지 못한 401 은 로그아웃의 근거가 되지 않는다', () => {
  assert.equal(isSessionGone(readErrorBody('<html>401</html>', 401)), false);
});

test('다른 실패로는 세션을 버리지 않는다', () => {
  assert.equal(isSessionGone(new ApiError('ENTRY_NOT_FOUND', '없어요', 404)), false);
  assert.equal(isSessionGone(new TypeError('네트워크')), false);
});

test('서버가 버전을 거절하면 업데이트를 알린다', () => {
  assert.equal(needsUpdate(new ApiError('UPDATE_REQUIRED', '업데이트가 필요해요', 426)), true);
  assert.equal(needsUpdate(new ApiError(OFFLINE, '연결을 확인해 주세요', 0)), false);
  assert.equal(needsUpdate(new TypeError('네트워크')), false);
});
