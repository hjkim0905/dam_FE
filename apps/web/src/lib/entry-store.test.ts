/**
 * 저장소는 로컬 데이터를 신뢰하지 않는다. 사용자가 직접 고칠 수 있고,
 * 예전 버전이 쓴 형태가 남아 있을 수도 있어서 깨진 항목은 조용히 버린다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEntries, serializeEntries } from './entry-store';

const valid = { date: '2026-08-18', color: '#8a9a7b', imageUrl: '', memo: '' };

test('parseEntries 는 올바른 기록을 읽는다', () => {
  assert.deepEqual(parseEntries(JSON.stringify([valid])), [valid]);
});

test('parseEntries 는 저장된 적 없으면 빈 배열을 준다', () => {
  assert.deepEqual(parseEntries(null), []);
  assert.deepEqual(parseEntries(''), []);
});

test('parseEntries 는 깨진 문자열에 던지지 않는다', () => {
  for (const raw of ['not json', '{', 'null', '"문자열"', '123']) {
    assert.deepEqual(parseEntries(raw), [], `입력: ${raw}`);
  }
});

test('parseEntries 는 형태가 어긋난 항목만 버리고 나머지는 살린다', () => {
  const raw = JSON.stringify([
    valid,
    { date: '2026-08-19' },
    { date: 1, color: '#fff', imageUrl: '', memo: '' },
    null,
  ]);

  assert.deepEqual(parseEntries(raw), [valid]);
});

test('serializeEntries 와 parseEntries 는 서로를 되돌린다', () => {
  assert.deepEqual(parseEntries(serializeEntries([valid])), [valid]);
});
