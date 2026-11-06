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

test("decodeCommand 는 https 링크만 연다", () => {
  const open = (url: string) =>
    decodeCommand(JSON.stringify({ type: "OPEN_URL", payload: { url } }));

  assert.deepEqual(open("https://example.com"), { type: "OPEN_URL", url: "https://example.com" });
  assert.equal(open("http://example.com"), null);
  assert.equal(open("javascript:alert(1)"), null);
  assert.equal(open("dam://close"), null);
});

test("세션이 끊겼다는 말을 알아본다", () => {
  assert.deepEqual(decodeCommand(JSON.stringify({ type: "SIGNED_OUT" })), {
    type: "SIGNED_OUT",
  });
});

test("READY 는 스플래시를 내려도 되는 시점으로 읽힌다", () => {
  assert.deepEqual(decodeCommand(JSON.stringify({ type: "READY" })), {
    type: "READY",
  });
});

test("OPEN_STORE 는 앱스토어를 여는 신호로 읽힌다", () => {
  assert.deepEqual(decodeCommand(JSON.stringify({ type: "OPEN_STORE" })), {
    type: "OPEN_STORE",
  });
});

test("별점 요청을 알아듣는다", () => {
  assert.deepEqual(decodeCommand(JSON.stringify({ type: "ASK_REVIEW" })), {
    type: "ASK_REVIEW",
  });
});

test("decodeCommand 는 https 사진의 누끼만 따 준다", () => {
  const ask = (payload: unknown) => decodeCommand(JSON.stringify({ type: "CUTOUT", payload }));

  assert.deepEqual(ask({ id: "7", url: "https://bucket.example/u9/a.jpg" }), {
    type: "CUTOUT",
    id: "7",
    url: "https://bucket.example/u9/a.jpg",
  });
  assert.equal(ask({ id: "7", url: "file:///etc/passwd" }), null);
  assert.equal(ask({ url: "https://bucket.example/u9/a.jpg" }), null);
});

test("decodeCommand 는 누른 자리가 사진 안일 때만 그 자리를 넘긴다", () => {
  const ask = (payload: unknown) => decodeCommand(JSON.stringify({ type: "CUTOUT", payload }));
  const url = "https://bucket.example/u9/a.jpg";

  assert.deepEqual(ask({ id: "7", url, x: 0.4, y: 0.6 }), { type: "CUTOUT", id: "7", url, point: { x: 0.4, y: 0.6 } });
  assert.equal(ask({ id: "7", url, x: 1.4, y: 0.6 }), null);
  assert.equal(ask({ id: "7", url, x: "0.4", y: 0.6 }), null);
});

test("decodeCommand 는 헤더 왼쪽 버튼 이름을 짧은 글자로만 받는다", () => {
  const header = (back: unknown) => decodeCommand(JSON.stringify({ type: "HEADER", payload: { back } }));

  assert.deepEqual(header("책장"), { type: "HEADER", back: "책장" });
  assert.deepEqual(header(null), { type: "HEADER", back: null });
  assert.equal(header("아주 아주 아주 긴 버튼 이름입니다"), null);
  assert.equal(header(3), null);
});
