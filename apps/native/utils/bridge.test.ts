/**
 * 브리지 파서 자체 검증. `npx tsx utils/bridge.test.ts` 로 실행한다.
 * 웹뷰에서 오는 문자열은 신뢰할 수 없으므로 깨진 입력에 던지지 않아야 한다.
 */
import assert from "node:assert/strict";
import { parseBridgeMessage } from "./bridge";

assert.deepEqual(parseBridgeMessage('{"type":"PING"}'), { type: "PING" });
assert.deepEqual(parseBridgeMessage('{"type":"SAVE","payload":{"hex":"#AABBCC"}}'), {
  type: "SAVE",
  payload: { hex: "#AABBCC" },
});

assert.equal(parseBridgeMessage("not json"), null);
assert.equal(parseBridgeMessage(""), null);
assert.equal(parseBridgeMessage("null"), null);
assert.equal(parseBridgeMessage('"just a string"'), null);
assert.equal(parseBridgeMessage("123"), null);
assert.equal(parseBridgeMessage("[1,2,3]"), null);

assert.equal(parseBridgeMessage('{"payload":{}}'), null);
assert.equal(parseBridgeMessage('{"type":42}'), null);

console.log("bridge parser: all assertions passed");
