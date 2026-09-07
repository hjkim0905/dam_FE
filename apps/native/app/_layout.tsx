import { Stack } from "expo-router";
import { PostHogProvider } from "posthog-react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { EVENT, posthog, track } from "../lib/analytics";
import { BACKGROUND } from "../theme";

/**
 * 들어가는 곳이 로그인이라 세션을 확인하는 동안 스플래시를 붙잡아 둔다. 놓아 버리면
 * 로그인 화면이 비쳤다가 홈으로 넘어가는 모습이 그대로 보인다. 내리는 것은 갈림길을
 * 정한 화면이 한다.
 */
SplashScreen.preventAutoHideAsync();

/** 서버에 닿지 못해도 앱이 스플래시에 갇히지는 않아야 한다. */
const GIVE_UP_MS = 6000;

export default function RootLayout() {
  useEffect(() => {
    track(EVENT.launched);
    const timer = setTimeout(() => void SplashScreen.hideAsync(), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, []);

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );

  /* client 를 undefined 로 넘기면 provider 가 apiKey 를 대신 찾다가 오류를 띄운다.
     키가 없는 곳에서는 provider 자체를 두지 않는 것이 조용하다.

     자동 수집이 닿는 곳은 웹뷰 바깥, 즉 로그인과 온보딩뿐이다. 탭 안쪽은
     네이티브 입장에서 화면 하나라 웹 PostHog 가 본다. */
  if (!posthog) return stack;

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{ captureScreens: true, captureTouches: true }}
    >
      {stack}
    </PostHogProvider>
  );
}
