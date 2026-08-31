import assert from "node:assert/strict";
import test from "node:test";
import { insetVariablesScript } from "./insets";

test("insetVariablesScript 는 두 변수를 px 로 심는다", () => {
  const script = insetVariablesScript({ top: 59, bottom: 83 });

  assert.match(script, /--inset-top:59px/);
  assert.match(script, /--inset-bottom:83px/);
});

test("insetVariablesScript 는 소수점 inset 을 반올림한다", () => {
  assert.match(insetVariablesScript({ top: 47.33, bottom: 0 }), /--inset-top:47px/);
});

test("insetVariablesScript 는 음수를 0 으로 막는다", () => {
  assert.match(insetVariablesScript({ top: -8, bottom: 0 }), /--inset-top:0px/);
});

test("insetVariablesScript 는 DOM 을 건드리지 않는다", () => {
  const script = insetVariablesScript({ top: 59, bottom: 83 });

  assert.ok(!script.includes("documentElement.style"));
  assert.match(script, /adoptedStyleSheets/);
});

test("insetVariablesScript 는 주입 경고를 피하려 true 로 끝난다", () => {
  assert.ok(insetVariablesScript({ top: 0, bottom: 0 }).endsWith("true;"));
});
