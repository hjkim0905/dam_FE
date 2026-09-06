import assert from 'node:assert/strict';
import test from 'node:test';
import { toEntry } from './entries';

const kept = {
  id: 91,
  date: '2026-09-03',
  color: '#8A9A7B',
  photoUrl: 'https://objectstorage/a.jpg?signature=x',
  memo: '안개가 걷히고 있었다',
  author: { id: 7, name: '지호' },
};

test('서버의 기록을 화면이 쓰는 모양으로 옮긴다', () => {
  const entry = toEntry(kept);

  assert.equal(entry.id, 91);
  assert.equal(entry.imageUrl, kept.photoUrl);
  assert.equal(entry.authorName, '지호');
});

test('작성자 id 는 문자열로 둔다', () => {
  // 내 것인지 가릴 때 세션의 내 id 와 견주므로 양쪽 타입이 같아야 한다.
  assert.equal(toEntry(kept).author, '7');
});

test('메모가 없으면 빈 문자열이다', () => {
  // 널을 그대로 두면 화면이 자리마다 널을 다뤄야 한다.
  assert.equal(toEntry({ ...kept, memo: null }).memo, '');
});
