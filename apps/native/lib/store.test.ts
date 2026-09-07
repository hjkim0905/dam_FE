import assert from "node:assert/strict";
import test from "node:test";
import { storeUrl } from "./store";

test("숫자 ID 로 앱스토어 주소를 만든다", () => {
  assert.equal(storeUrl("123456789"), "itms-apps://apps.apple.com/app/id123456789");
});

test("아직 ID 가 없으면 열 곳이 없다", () => {
  // 앱 레코드를 만들기 전에는 비어 있다. 빈 주소로 열면 사파리가 뜬다.
  assert.equal(storeUrl(""), null);
});

test("숫자가 아닌 것은 주소로 만들지 않는다", () => {
  assert.equal(storeUrl("com.hjkim.dam"), null);
  assert.equal(storeUrl("id123"), null);
});
