/**
 * 무엇을 보내는가보다 무엇을 안 보내는가가 중요하다. 메모 본문과 사진 주소는
 * 사람의 하루라서 절대 실려 나가면 안 된다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { daysAgo, memoShape, personPropertiesOf, roomGroupOf } from './analytics';
import type { ProfileResponse } from './api/types';

function profile(over: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    id: 7,
    name: '지호',
    onboarded: true,
    keptCount: 12,
    firstKeptDate: '2026-05-01',
    room: { id: 3, partner: { id: 9, name: '민서' }, joinedAt: '2026-05-01T00:00:00Z' },
    ...over,
  };
}

test('personPropertiesOf 는 이름을 빼고 보낸다', () => {
  const props = personPropertiesOf(profile());

  assert.equal('name' in props, false);
  assert.equal(props.kept_count, 12);
  assert.equal(props.has_room, true);
  assert.equal(props.has_partner, true);
});

test('personPropertiesOf 는 혼자 쓰는 사람과 짝이 있는 사람을 가른다', () => {
  const alone = personPropertiesOf(profile({ room: null }));
  assert.equal(alone.has_room, false);
  assert.equal(alone.has_partner, false);

  const waiting = personPropertiesOf(
    profile({ room: { id: 3, partner: null, joinedAt: '2026-05-01T00:00:00Z' } })
  );
  assert.equal(waiting.has_room, true);
  assert.equal(waiting.has_partner, false);
});

test('roomGroupOf 는 방을 그룹으로 준다', () => {
  assert.deepEqual(roomGroupOf(profile()), { key: '3', properties: { has_partner: true } });
});

test('roomGroupOf 는 방이 없으면 아무것도 주지 않는다', () => {
  assert.equal(roomGroupOf(profile({ room: null })), null);
});

test('memoShape 는 길이만 남기고 본문을 버린다', () => {
  const shaped = memoShape('오늘은 비가 왔다');

  assert.deepEqual(shaped, { has_memo: true, memo_length: 9 });
  assert.equal(Object.values(shaped).includes('오늘은 비가 왔다' as never), false);
});

test('memoShape 는 빈 메모를 없는 것으로 본다', () => {
  assert.deepEqual(memoShape(null), { has_memo: false, memo_length: 0 });
  assert.deepEqual(memoShape('   '), { has_memo: false, memo_length: 0 });
});

test('daysAgo 는 지난 날을 담는 것과 오늘을 담는 것을 가른다', () => {
  assert.equal(daysAgo('2026-09-07', '2026-09-07'), 0);
  assert.equal(daysAgo('2026-09-01', '2026-09-07'), 6);
});

test('daysAgo 는 달을 넘어가도 센다', () => {
  assert.equal(daysAgo('2026-08-31', '2026-09-01'), 1);
});
