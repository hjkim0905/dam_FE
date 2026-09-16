/**
 * 레딧에서 온 사람이 한국어 화면을 보면 그 자리에서 나간다. 모르는 언어는
 * 한국어가 아니라 영어로 떨어뜨려야 하는 이유다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { pickLocale } from './i18n';

test('pickLocale 은 기기가 먼저 원하는 언어를 고른다', () => {
  assert.equal(pickLocale(['ko-KR', 'en-US']), 'ko');
  assert.equal(pickLocale(['en-US', 'ko-KR']), 'en');
});

test('pickLocale 은 지역이 붙어 있어도 알아본다', () => {
  assert.equal(pickLocale(['ko-KR']), 'ko');
  assert.equal(pickLocale(['en-GB']), 'en');
});

test('pickLocale 은 모르는 언어를 영어로 떨어뜨린다', () => {
  assert.equal(pickLocale(['ja-JP']), 'en');
  assert.equal(pickLocale(['de-DE', 'fr-FR']), 'en');
});

test('pickLocale 은 아는 언어가 나올 때까지 훑는다', () => {
  assert.equal(pickLocale(['de-DE', 'ko-KR']), 'ko');
});

test('pickLocale 은 아무것도 못 받아도 터지지 않는다', () => {
  assert.equal(pickLocale([]), 'en');
});
