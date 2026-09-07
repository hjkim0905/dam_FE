import assert from 'node:assert/strict';
import test from 'node:test';
import { isOlderThan } from './version';

test('자리마다 숫자로 견준다', () => {
  // 문자열로 비교하면 "1.10.0" 이 "1.9.0" 보다 작다고 나온다.
  assert.equal(isOlderThan('1.9.0', '1.10.0'), true);
  assert.equal(isOlderThan('1.10.0', '1.9.0'), false);
});

test('같은 버전은 낡지 않았다', () => {
  assert.equal(isOlderThan('1.2.3', '1.2.3'), false);
});

test('자리 수가 달라도 견준다', () => {
  assert.equal(isOlderThan('1.2', '1.2.1'), true);
  assert.equal(isOlderThan('1.2.0', '1.2'), false);
  assert.equal(isOlderThan('2', '1.9.9'), false);
});

test('읽을 수 없는 자리는 0 으로 본다', () => {
  // 버전을 못 읽었다고 사람을 막아 세우면, 고칠 방법 없이 앱이 잠긴다.
  assert.equal(isOlderThan('', '1.0.0'), true);
  assert.equal(isOlderThan('1.0.0', 'nope'), false);
});
