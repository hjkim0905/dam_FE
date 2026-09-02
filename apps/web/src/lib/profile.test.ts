/**
 * 이름과 초대코드는 사람이 읽고 불러 주는 값이다. 앞뒤 공백이나 소문자로 들어와도
 * 같은 것으로 봐야 하고, 빈 이름이 방에 남으면 누가 누군지 알 수 없다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanName, isInviteCode, normalizeInviteCode } from './profile';

test('cleanName 은 앞뒤 공백과 겹친 공백을 정리한다', () => {
  assert.equal(cleanName('  지 호  '), '지 호');
});

test('cleanName 은 빈 이름을 그대로 두지 않는다', () => {
  assert.equal(cleanName('   '), '이름 없음');
});

test('cleanName 은 너무 긴 이름을 자른다', () => {
  assert.equal(cleanName('가'.repeat(20)).length, 12);
});

test('isInviteCode 는 여섯 자리 코드만 받는다', () => {
  assert.equal(isInviteCode('H7K2QM'), true);
  assert.equal(isInviteCode('H7K2Q'), false);
  assert.equal(isInviteCode('H7K2QMX'), false);
});

test('isInviteCode 는 헷갈리는 글자를 받지 않는다', () => {
  // O 와 0, I 와 1 은 불러 줄 때 섞인다.
  assert.equal(isInviteCode('H7K2QO'), false);
  assert.equal(isInviteCode('H7K2QI'), false);
});

test('normalizeInviteCode 는 소문자와 사이 기호를 걷어낸다', () => {
  assert.equal(normalizeInviteCode(' h7k-2qm '), 'H7K2QM');
});
