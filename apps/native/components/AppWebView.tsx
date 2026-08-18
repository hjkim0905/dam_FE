import { useCallback, useRef } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import WebViewBase from "react-native-webview";
import type WebViewInstance from "react-native-webview";
import type { WebViewProps } from "react-native-webview/lib/WebView";
import type { WebViewMessageEvent } from "react-native-webview/lib/WebViewTypes";
import { BACKGROUND } from "../theme";
import { decodeCommand } from "../utils/bridge";
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

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const command = decodeCommand(event.nativeEvent.data);
    if (!command) return;

    if (command.type === "PING") {
      webViewRef.current?.postMessage(JSON.stringify({ type: "PONG" }));
      return;
    }
    if (command.type === "HAPTIC") PLAY_HAPTIC[command.style]();
  }, []);

  return (
    <View style={styles.screen}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}${path}` }}
        style={styles.webview}
        onMessage={onMessage}
        contentInsetAdjustmentBehavior="never"
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
