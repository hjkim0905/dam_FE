export type BridgeMessage = {
  type: string;
  payload?: unknown;
};

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
}

export function sendToNative(message: BridgeMessage): void {
  if (!isNativeApp()) return;
  window.ReactNativeWebView!.postMessage(JSON.stringify(message));
}

export function subscribeToNative(
  handler: (message: BridgeMessage) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: MessageEvent) => {
    if (typeof event.data !== 'string') return;
    try {
      const parsed: unknown = JSON.parse(event.data);
      if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
        handler(parsed as BridgeMessage);
      }
    } catch {
      return;
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

export function requestHaptic(style: 'selection' | 'light' | 'medium'): void {
  sendToNative({ type: 'HAPTIC', payload: { style } });
}

/**
 * 세션이 끊겼다. 토큰은 네이티브가 들고 있으므로 버리는 것도 네이티브가 한다.
 * 로그인 화면도 네이티브에 있어서 어디로 갈지까지 네이티브가 안다.
 */
export function signedOut(): void {
  sendToNative({ type: 'SIGNED_OUT' });
}

/** 약관과 방침은 앱 밖 문서다. 웹뷰 안에서 열면 돌아올 길이 없다. */
export function openOutside(url: string): void {
  sendToNative({ type: 'OPEN_URL', payload: { url } });
}
