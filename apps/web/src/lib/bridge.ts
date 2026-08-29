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
