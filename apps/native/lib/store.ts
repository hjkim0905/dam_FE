/**
 * 앱스토어로 보내는 주소. itms-apps 로 열면 사파리를 거치지 않고 앱스토어 앱이
 * 바로 뜬다. ID 를 아직 안 받았으면 열 곳이 없으므로 null 이다.
 */
export function storeUrl(appStoreId: string): string | null {
  if (!/^\d+$/.test(appStoreId)) return null;
  return `itms-apps://apps.apple.com/app/id${appStoreId}`;
}
