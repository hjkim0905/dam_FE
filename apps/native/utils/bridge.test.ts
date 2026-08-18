/**
 * 웹뷰에서 오는 문자열은 신뢰할 수 없으므로 깨진 입력에 던지지 않아야 한다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { decodeCommand, parseBridgeMessage } from "./bridge";

test("parseBridgeMessage는 type이 있는 객체만 통과시킨다", () => {
  assert.deepEqual(parseBridgeMessage('{"type":"PING"}'), { type: "PING" });
  assert.deepEqual(
    parseBridgeMessage('{"type":"SAVE","payload":{"hex":"#AABBCC"}}'),
    { type: "SAVE", payload: { hex: "#AABBCC" } }
  );
});

test("parseBridgeMessage는 깨진 입력에 null을 준다", () => {
  for (const raw of [
    "not json",
    "",
    "null",
    '"just a string"',
    "123",
    "[1,2,3]",
    '{"payload":{}}',
    '{"type":42}',
  ]) {
    assert.equal(parseBridgeMessage(raw), null, `입력: ${raw}`);
  }
});

test("decodeCommand는 아는 명령만 타입을 붙여 넘긴다", () => {
  assert.deepEqual(decodeCommand('{"type":"PING"}'), { type: "PING" });
  assert.deepEqual(
    decodeCommand('{"type":"HAPTIC","payload":{"style":"selection"}}'),
    { type: "HAPTIC", style: "selection" }
  );
});

test("decodeCommand는 모르는 명령에 null을 준다", () => {
  assert.equal(decodeCommand('{"type":"LAUNCH_MISSILES"}'), null);
});

test("decodeCommand는 payload가 규격에 안 맞으면 null을 준다", () => {
  assert.equal(decodeCommand('{"type":"HAPTIC"}'), null);
  assert.equal(decodeCommand('{"type":"HAPTIC","payload":{"style":"boom"}}'), null);
  assert.equal(decodeCommand('{"type":"HAPTIC","payload":"selection"}'), null);
});
