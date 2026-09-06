import assert from "node:assert/strict";
import test from "node:test";
import { cleanName } from "./name";

test("앞뒤 공백을 떼고 사이 공백은 하나로 줄인다", () => {
  assert.equal(cleanName("  지  호 "), "지 호");
});

test("빈 이름은 대신 부를 말을 준다", () => {
  // 서버가 NOT NULL 로 받으므로 빈 채로 보내면 거절당한다.
  assert.equal(cleanName("   "), "이름 없음");
});

test("열두 자에서 자른다", () => {
  assert.equal(cleanName("가".repeat(20)).length, 12);
});
