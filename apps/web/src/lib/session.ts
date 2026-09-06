/**
 * 세션 토큰을 읽는 곳. 넣는 것은 네이티브다. 탭마다 WebView 가 따로 살아서
 * 한쪽이 저장하면 나머지가 못 보기 때문에, 네이티브가 뜨기 전에 넣어 준다.
 */
const TOKEN_KEY = 'dam.session';

export function loadToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}
