import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, isSessionGone } from "./errors";

test("서버가 토큰을 거절했을 때만 세션을 버린다", () => {
  assert.equal(isSessionGone(new ApiError("UNAUTHENTICATED", "다시 로그인해 주세요")), true);
});

test("연결이 끊긴 것은 세션과 상관없다", () => {
  // 여기서 참을 주면 비행기 모드로 앱을 연 사람이 토큰을 잃는다.
  assert.equal(isSessionGone(new ApiError("OFFLINE", "연결을 확인해 주세요")), false);
});

test("다른 실패로는 세션을 버리지 않는다", () => {
  assert.equal(isSessionGone(new ApiError("UNREADABLE", "잠시 뒤에")), false);
  assert.equal(isSessionGone(new TypeError("네트워크")), false);
  assert.equal(isSessionGone(null), false);
});
