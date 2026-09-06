/**
 * 웹 → 네이티브 브리지 검증. `yarn test` 로 실행한다.
 * 네이티브에서 오는 문자열은 신뢰할 수 없으므로 깨진 입력에 던지지 않아야 한다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { isNativeApp, sendToNative, subscribeToNative
} from './bridge';

type Listener = (event: { data: unknown }) => void;

function stubWindow(withNativeBridge: boolean) {
  const posted: string[] = [];
  const listeners = new Set<Listener>();

  (globalThis as { window?: unknown }).window = {
    ...(withNativeBridge
      ? { ReactNativeWebView: { postMessage: (m: string) => posted.push(m) } }
      : {}),
    addEventListener: (_type: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_type: string, fn: Listener) => listeners.delete(fn),
  };

  return {
    posted,
    emit: (data: unknown) => listeners.forEach((fn) => fn({ data })),
    listenerCount: () => listeners.size,
  };
}

test.afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

test('네이티브 웹뷰 안이면 isNativeApp이 참이다', () => {
  stubWindow(true);
  assert.equal(isNativeApp(), true);
});

test('일반 브라우저면 isNativeApp이 거짓이다', () => {
  stubWindow(false);
  assert.equal(isNativeApp(), false);
});

test('sendToNative는 메시지를 JSON 문자열로 넘긴다', () => {
  const w = stubWindow(true);
  sendToNative({ type: 'SAVE', payload: { hex: '#AABBCC' } });
  assert.deepEqual(JSON.parse(w.posted[0]), {
    type: 'SAVE',
    payload: { hex: '#AABBCC' },
  });
});

test('브라우저에서는 sendToNative가 조용히 무시된다', () => {
  const w = stubWindow(false);
  sendToNative({ type: 'PING' });
  assert.equal(w.posted.length, 0);
});

test('subscribeToNative는 정상 메시지만 핸들러로 넘긴다', () => {
  const w = stubWindow(true);
  const received: unknown[] = [];
  subscribeToNative((m) => received.push(m));

  w.emit('{"type":"PONG"}');
  w.emit('not json');
  w.emit('null');
  w.emit('"just a string"');
  w.emit('123');
  w.emit('[1,2,3]');
  w.emit('{"payload":{}}');
  w.emit({ type: 'PONG' });

  assert.deepEqual(received, [{ type: 'PONG' }]);
});

test('구독 해제하면 리스너가 제거된다', () => {
  const w = stubWindow(true);
  const unsubscribe = subscribeToNative(() => {});
  assert.equal(w.listenerCount(), 1);
  unsubscribe();
  assert.equal(w.listenerCount(), 0);
});

test('window가 없는 SSR 환경에서도 던지지 않는다', () => {
  assert.equal(isNativeApp(), false);
  assert.doesNotThrow(() => sendToNative({ type: 'PING' }));
  assert.doesNotThrow(() => subscribeToNative(() => {})());
});

