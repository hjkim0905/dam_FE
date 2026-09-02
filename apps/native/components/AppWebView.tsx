import { useCallback, useRef } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import WebViewBase from "react-native-webview";
import type WebViewInstance from "react-native-webview";
import type { WebViewProps } from "react-native-webview/lib/WebView";
import type { WebViewMessageEvent } from "react-native-webview/lib/WebViewTypes";
import { BACKGROUND } from "../theme";
import LoadingCapsule from "./LoadingCapsule";
import { decodeCommand } from "../utils/bridge";
import { insetVariablesScript } from "../utils/insets";
import { holdWeb } from "../utils/web-channel";
import type { HapticStyle } from "../utils/bridge";

const WebView = WebViewBase as unknown as ForwardRefExoticComponent<
  WebViewProps & RefAttributes<WebViewInstance>
>;

const WEB_URL: string = Constants.expoConfig?.extra?.webUrl;


const PLAY_HAPTIC: Record<HapticStyle, () => Promise<void>> = {
  selection: () => Haptics.selectionAsync(),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
};

export default function AppWebView({ path }: { path: string }) {
  const webViewRef = useRef<WebViewInstance>(null);
  const insets = useSafeAreaInsets();

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const command = decodeCommand(event.nativeEvent.data);
    if (!command) return;

    if (command.type === "PING") {
      webViewRef.current?.postMessage(JSON.stringify({ type: "PONG" }));
      return;
    }
    if (command.type === "HAPTIC") PLAY_HAPTIC[command.style]();
    if (command.type === "OPEN_URL") Linking.openURL(command.url);
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

  return (
    <View style={styles.screen}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}${path}` }}
        style={styles.webview}
        onMessage={onMessage}
        injectedJavaScriptBeforeContentLoaded={insetVariablesScript(insets)}
        startInLoadingState
        renderLoading={() => <LoadingCapsule />}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  webview: { flex: 1, backgroundColor: BACKGROUND },
});
