/**
 * 로그인과 온보딩은 네이티브에 있다. 여기가 한국어로 남으면 바깥에서 온 사람은
 * 첫 화면에서 막힌다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pickLocale, strings } from "./i18n";
import type { Locale } from "./i18n";

test("pickLocale 은 기기가 먼저 원하는 언어를 고른다", () => {
  assert.equal(pickLocale(["ko-KR", "en-US"]), "ko");
  assert.equal(pickLocale(["en-US", "ko-KR"]), "en");
});

test("pickLocale 은 지역이 붙어 있어도 알아본다", () => {
  assert.equal(pickLocale(["en-GB"]), "en");
});

test("pickLocale 은 모르는 언어를 영어로 떨어뜨린다", () => {
  assert.equal(pickLocale(["de-DE"]), "en");
  assert.equal(pickLocale([]), "en");
});

test("pickLocale 은 일본어도 알아본다", () => {
  assert.equal(pickLocale(["ja-JP"]), "ja");
  assert.equal(pickLocale(["de-DE", "ja"]), "ja");
});

test("세 사전이 같은 키를 갖는다", () => {
  const keys = (l: Locale) => Object.keys(strings(l)).sort().join(",");
  assert.equal(keys("en"), keys("ko"));
  assert.equal(keys("ja"), keys("ko"));
});
