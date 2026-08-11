import { useCallback, useRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import WebViewBase from 'react-native-webview';
import type WebViewInstance from 'react-native-webview';
import type { WebViewProps } from 'react-native-webview/lib/WebView';
import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { handleBridgeMessage, parseBridgeMessage } from './utils/bridge';

const WebView = WebViewBase as unknown as ForwardRefExoticComponent<
  WebViewProps & RefAttributes<WebViewInstance>
>;

const WEB_URL: string = Constants.expoConfig?.extra?.webUrl;

SplashScreen.preventAutoHideAsync();

export default function App() {
  const webViewRef = useRef<WebViewInstance>(null);

  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    const message = parseBridgeMessage(event.nativeEvent.data);
    if (!message) return;

    const reply = await handleBridgeMessage(message);
    if (reply) webViewRef.current?.postMessage(JSON.stringify(reply));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onMessage={onMessage}
        onLoadEnd={() => SplashScreen.hideAsync()}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webview: { flex: 1 },
});
