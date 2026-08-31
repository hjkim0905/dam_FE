/**
 * 탭 복귀 시 어디로 되돌릴지. 잘못 고르면 다른 탭의 첫 화면으로 튕겨 나간다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { tabRootFor } from './tabs';

test('tabRootFor는 첫 화면이면 되돌릴 곳이 없다', () => {
  assert.equal(tabRootFor('/'), null);
  assert.equal(tabRootFor('/calendar'), null);
  assert.equal(tabRootFor('/flow'), null);
  assert.equal(tabRootFor('/calendar/'), null);
});

test('tabRootFor는 하위 화면을 자기 탭의 첫 화면으로 되돌린다', () => {
  assert.equal(tabRootFor('/record'), '/');
  assert.equal(tabRootFor('/calendar/2026-08-31'), '/calendar');
  assert.equal(tabRootFor('/flow/room'), '/flow');
});

test('tabRootFor는 이름만 겹치는 경로를 다른 탭으로 보내지 않는다', () => {
  assert.equal(tabRootFor('/calendars'), '/');
});
