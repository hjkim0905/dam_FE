import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
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
    const timer = setTimeout(() => void SplashScreen.hideAsync(), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
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
}
