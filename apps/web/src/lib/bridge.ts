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

/**
 * 첫 화면을 그릴 수 있게 됐다. 네이티브는 이 신호를 받고서야 스플래시를 내린다.
 * 웹뷰가 문서를 다 받은 시점에 내리면 프로필을 기다리는 빈 화면이 비친다.
 */
export function ready(): void {
  sendToNative({ type: 'READY' });
}

/** 앱스토어는 웹뷰가 열 수 없다. 여는 것도, 어느 앱인지 아는 것도 네이티브다. */
export function openStore(): void {
  sendToNative({ type: 'OPEN_STORE' });
}

/** 약관과 방침은 앱 밖 문서다. 웹뷰 안에서 열면 돌아올 길이 없다. */
/** 별점 창은 iOS 가 띄운다. 언제 띄울지는 웹이 알고, 띄우는 것은 네이티브만 한다. */
export function askForReview(): void {
  sendToNative({ type: 'ASK_REVIEW' });
}

export function openOutside(url: string): void {
  sendToNative({ type: 'OPEN_URL', payload: { url } });
}

/* 누끼는 기기 안의 Vision 이 딴다. 사진 한 장에 1초 안팎이라 넉넉히 기다린다. */
const CUTOUT_TIMEOUT_MS = 15000;
let cutoutsAsked = 0;

/** 피사체만 남긴 PNG 의 data URL. point 가 있으면 그 자리의 피사체 하나다. 브라우저이거나 피사체를 못 찾으면 null 이다. */
export function requestCutout(key: string, url: string, point?: { x: number; y: number }): Promise<string | null> {
  if (!isNativeApp()) return Promise.resolve(null);
  cutoutsAsked += 1;
  const id = `${key}#${cutoutsAsked}`;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, CUTOUT_TIMEOUT_MS);
    const unsubscribe = subscribeToNative((message) => {
      if (message.type !== 'CUTOUT') return;
      const payload = message.payload as { id?: unknown; image?: unknown } | undefined;
      if (payload?.id !== id) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(typeof payload.image === 'string' && payload.image.startsWith('data:image/png') ? payload.image : null);
    });
    sendToNative({ type: 'CUTOUT', payload: { id, url, ...point } });
  });
}
