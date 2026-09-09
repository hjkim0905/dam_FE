import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as StoreReview from "expo-store-review";
import WebViewBase from "react-native-webview";
import type WebViewInstance from "react-native-webview";
import type { WebViewProps } from "react-native-webview/lib/WebView";
import type { WebViewMessageEvent } from "react-native-webview/lib/WebViewTypes";
import { BACKGROUND } from "../theme";
import LoadingCapsule from "./LoadingCapsule";
import Unreachable from "./Unreachable";
import { storeUrl } from "../lib/store";
import { decodeCommand } from "../utils/bridge";
import { insetVariablesScript } from "../utils/insets";
import { EVENT, forget, track } from "../lib/analytics";
import { clearToken, loadToken } from "../lib/session";
import { holdWeb } from "../utils/web-channel";
import type { HapticStyle } from "../utils/bridge";

const WebView = WebViewBase as unknown as ForwardRefExoticComponent<
  WebViewProps & RefAttributes<WebViewInstance>
>;

const WEB_URL: string = Constants.expoConfig?.extra?.webUrl;
const API_URL: string = Constants.expoConfig?.extra?.apiUrl;

const PLAY_HAPTIC: Record<HapticStyle, () => Promise<void>> = {
  selection: () => Haptics.selectionAsync(),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
};

export default function AppWebView({ path }: { path: string }) {
  const webViewRef = useRef<WebViewInstance>(null);
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    void loadToken().then(setToken);
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const command = decodeCommand(event.nativeEvent.data);
    if (!command) return;

    // 로그인해 둔 사람은 로그인 화면을 거치지 않고 곧장 여기로 온다. 그 길에는
    // 스플래시를 내리는 자리가 여기밖에 없다.
    if (command.type === "READY") {
      void SplashScreen.hideAsync();
      return;
    }
    if (command.type === "PING") {
      webViewRef.current?.postMessage(JSON.stringify({ type: "PONG" }));
      return;
    }
    // 얼마나 자주 띄울지는 iOS 가 정한다(연 3회). 우리는 물을 만한 순간만 고른다.
    if (command.type === "ASK_REVIEW") {
      void StoreReview.isAvailableAsync()
        .then((can) => (can ? StoreReview.requestReview() : undefined))
        .catch(() => {});
    }
    if (command.type === "HAPTIC") PLAY_HAPTIC[command.style]();
    if (command.type === "OPEN_URL") Linking.openURL(command.url);
    if (command.type === "OPEN_STORE") {
      const url = storeUrl(Constants.expoConfig?.extra?.appStoreId ?? "");
      if (url) Linking.openURL(url);
    }
    if (command.type === "SIGNED_OUT") {
      forget();
      void clearToken().then(() => router.replace("/"));
    }
  }, []);

  // 탭마다 WebView 가 따로 살아 있어 화면 상태가 그대로 남는다. 드나든 사실은
  // 네이티브만 알 수 있으므로 웹에 알려주고, 처리 여부는 각 화면이 정한다.
  //
  // 떠날 때도 알리는 이유: 되돌리기를 돌아온 뒤에 하면 그 왕복이 화면에 보인다.
  // 탭이 가려진 동안 미리 되돌려 두면 다시 왔을 때 이미 첫 화면이다.
  useFocusEffect(
    useCallback(() => {
      holdWeb((message) => webViewRef.current?.postMessage(message));
      webViewRef.current?.postMessage(JSON.stringify({ type: "FOCUS" }));
      return () => {
        holdWeb(null);
        webViewRef.current?.postMessage(JSON.stringify({ type: "BLUR" }));
      };
    }, [])
  );

  // 토큰을 읽기 전에 띄우면 웹이 로그인부터 다시 하라고 판단한다.
  if (token === null) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}${path}` }}
        style={styles.webview}
        onMessage={onMessage}
        injectedJavaScriptBeforeContentLoaded={
          insetVariablesScript(insets) + sessionScript(token) + apiScript()
        }
        startInLoadingState
        renderLoading={() => <LoadingCapsule />}
        // 웹뷰가 페이지를 못 받으면 iOS 가 영문 오류 페이지를 그린다. 그 순간
        // 앱이 아니라 브라우저로 보이므로 우리 화면으로 덮는다.
        //
        // 여기까지 오면 웹이 READY 를 보낼 일이 없다. 스플래시를 직접 내리지
        // 않으면 오류 화면이 6초 동안 가려진 채로 있는다.
        onError={() => {
          track(EVENT.webUnreachable);
          void SplashScreen.hideAsync();
        }}
        renderError={() => <Unreachable onRetry={() => webViewRef.current?.reload()} />}
        contentInsetAdjustmentBehavior="never"
        webviewDebuggingEnabled={__DEV__}
        scalesPageToFit={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsLinkPreview={false}
      />
    </View>
  );
}

/**
 * 세션은 네이티브가 들고 있다. 탭마다 WebView 가 따로 살아서 한쪽이 저장해 두면
 * 나머지가 못 보기 때문이다. 뜨기 전에 넣어 주면 첫 요청부터 토큰이 붙는다.
 */
function sessionScript(token: string): string {
  return `try { localStorage.setItem('dam.session', ${JSON.stringify(token)}); } catch (e) {} true;`;
}

/**
 * 서버 주소도 네이티브가 알려준다. 웹이 따로 들고 있으면 LAN IP 가 바뀔 때마다
 * 두 군데를 고쳐야 하고, 한쪽만 고치면 로그인은 되는데 화면이 비는 상태가 된다.
 */
function apiScript(): string {
  const version = Constants.expoConfig?.version ?? "";
  return (
    `window.__DAM_API__ = ${JSON.stringify(API_URL)};` +
    `window.__DAM_VERSION__ = ${JSON.stringify(version)}; true;`
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  webview: { flex: 1, backgroundColor: BACKGROUND },
});
