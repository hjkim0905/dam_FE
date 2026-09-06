import * as SecureStore from "expo-secure-store";

/**
 * 세션 토큰은 네이티브가 들고 있는다. 웹뷰가 탭마다 따로 살아서 한쪽 저장소에
 * 두면 나머지가 못 본다. 여기서 갖고 있다가 웹뷰가 뜰 때마다 넣어 준다.
 */
const KEY = "dam.session";

export async function loadToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    // 키체인이 잠겨 있거나 읽히지 않는 경우다. 없는 것으로 보고 로그인부터 한다.
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
