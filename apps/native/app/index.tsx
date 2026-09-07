import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Entrance from "../components/Entrance";
import { ApiError, fetchProfile, isSessionGone, signInWithApple } from "../lib/api";
import { EVENT, identify, track } from "../lib/analytics";
import { clearToken, loadToken, saveToken } from "../lib/session";
import { ALERT, FONT, MUTED } from "../theme";

/**
 * 로그인은 네이티브가 그린다. 웹뷰를 띄우면 첫 화면에서 부팅을 기다려야 하고,
 * 애플 버튼도 애플이 주는 컴포넌트를 그대로 쓸 수 없다.
 *
 * 세션이 여기 있으므로 로그인 여부에 따른 갈림길도 여기서 정한다. 탭 안쪽의
 * 화면 이동은 그대로 웹이 정한다.
 */
export default function SignIn() {
  const [failed, setFailed] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const settle = useCallback(async () => {
    const token = await loadToken();
    if (token === null) {
      await SplashScreen.hideAsync();
      return;
    }

    try {
      const profile = await fetchProfile(token);
      identify(String(profile.id));
      router.replace(profile.onboarded ? "/home" : "/onboarding");
    } catch (error) {
      // 토큰이 죽은 것만 버린다. 서버에 닿지 못한 것까지 같이 버리면, 지하철에서
      // 앱을 연 사람이 저장된 토큰을 잃고 애플 로그인부터 다시 해야 한다.
      if (isSessionGone(error)) await clearToken();
      else setFailed("연결이 닿지 않아요. 잠시 뒤에 다시 열어 주세요");
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    void settle();
  }, [settle]);

  const start = async () => {
    setFailed(null);
    track(EVENT.signInStarted);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
      });
      if (credential.identityToken === null) {
        setFailed("로그인을 확인하지 못했어요");
        return;
      }

      // 시트가 닫힌 뒤부터 서버를 기다린다. 여기가 화면이 멈춘 것처럼 보이던 구간이다.
      setWorking(true);

      // 애플이 이름을 주는 것은 첫 로그인 한 번뿐이다. 놓치면 다시 받을 길이 없다.
      const { givenName, familyName } = credential.fullName ?? {};
      const session = await signInWithApple({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode ?? undefined,
        fullName: [familyName, givenName].filter(Boolean).join("") || undefined,
      });

      await saveToken(session.accessToken);
      identify(String(session.user.id));
      track(EVENT.signedIn, { first_time: !session.user.onboarded });
      router.replace(session.user.onboarded ? "/home" : "/onboarding");
    } catch (error) {
      setWorking(false);
      // 시트를 스스로 내린 것은 실패가 아니다. 잘못한 것처럼 말하지 않는다.
      if ((error as { code?: string }).code === "ERR_REQUEST_CANCELED") {
        track(EVENT.signInCancelled);
        return;
      }
      track(EVENT.signInFailed, {
        reason: error instanceof ApiError ? error.code : "unknown",
      });
      setFailed(error instanceof ApiError ? error.message : "잠시 뒤에 다시 시도해 주세요");
    }
  };

  return (
    <Entrance
      title="담."
      titleSize={56}
      lead={"하루 사진 한 장에서\n색 하나를 담아요"}
      top={180}
      busy={working}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={32}
        style={styles.apple}
        onPress={() => void start()}
      />
      <Text style={[styles.note, failed !== null && styles.failed]}>
        {failed ?? "계속하면 약관과 개인정보 처리방침에\n동의하게 돼요"}
      </Text>
    </Entrance>
  );
}

const styles = StyleSheet.create({
  /* 애플이 정한 버튼이라 모양을 우리가 만들지 않는다. 높이만 담의 리듬에 맞춘다. */
  apple: { width: "100%", height: 64 },
  note: { fontFamily: FONT, fontSize: 14, lineHeight: 28, color: MUTED, textAlign: "center" },
  failed: { color: ALERT },
});
