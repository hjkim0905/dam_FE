import assert from "node:assert/strict";
import test from "node:test";
import { DOCUMENTS } from "./documents";

test("온보딩과 심사에 필요한 문서가 모두 있다", () => {
  // 개인정보 처리방침은 앱스토어 제출 필수 항목이고, 이용약관은 온보딩에서
  // 동의를 받는다. 키가 빠지면 화면에서 undefined 를 열려고 한다.
  assert.deepEqual(Object.keys(DOCUMENTS).sort(), ["contact", "privacy", "terms"]);
});

test("주소가 열 수 있는 https 절대 주소다", () => {
  // Linking.openURL 은 잘못된 주소에 조용히 실패한다. 상대 경로나 오타를
  // 여기서 잡지 않으면 사용자가 눌러도 아무 일이 안 일어난다.
  for (const [name, url] of Object.entries(DOCUMENTS)) {
    assert.doesNotThrow(() => new URL(url), `${name} 주소를 해석할 수 없다`);
    assert.ok(url.startsWith("https://"), `${name} 이 https 가 아니다`);
  }
});
