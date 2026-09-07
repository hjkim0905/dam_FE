import { BACKGROUND } from "./theme";

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

/**
 * 개발에서는 웹이 3000, 서버가 8080 으로 따로 뜬다. 배포에서는 Caddy 가 둘을
 * 같은 주소로 묶으므로 포트를 건드리면 안 된다. 주소에 포트가 박혀 있는지가
 * 그 둘을 가르는 표시다. 필요하면 API_URL 로 직접 지정한다.
 */
function apiUrlFrom(webUrl) {
  const url = new URL(webUrl);
  if (url.port) url.port = "8080";
  return `${url.origin}/api/v1`;
}

export default {
  expo: {
    name: "담",
    slug: "dam",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    backgroundColor: BACKGROUND,
    newArchEnabled: true,
    scheme: "dam",
    platforms: ["ios"],
    icon: "./assets/icon.png",
    ios: {
      buildNumber: "1",
      supportsTablet: false,
      // Sign in with Apple 권한(entitlement)을 켠다. 이게 없으면 시트가 뜨지 않는다.
      usesAppleSignIn: true,
      bundleIdentifier: "com.hjkim.dam",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // 번들이 한국어를 지원한다고 알려야 WebKit 이 사진 선택 시트를 한국어로 그린다.
        CFBundleDevelopmentRegion: "ko",
        CFBundleLocalizations: ["ko"],
        // 없으면 사진 선택기를 띄우는 순간 iOS 가 앱을 종료한다.
        NSCameraUsageDescription: "오늘의 사진을 찍어 그날의 색을 담습니다.",
        NSPhotoLibraryUsageDescription:
          "앨범에서 고른 사진으로 그날의 색을 담습니다.",
      },
    },
    plugins: [
      "expo-router",
      "expo-apple-authentication",
      [
        "expo-splash-screen",
        {
          image: "./assets/icon_without_background.png",
          imageWidth: 140,
          resizeMode: "contain",
          backgroundColor: BACKGROUND,
        },
      ],
      "expo-image",
      ["expo-font", { fonts: ["./assets/Galmuri14.ttf"] }],
      [
        "expo-build-properties",
        {
          ios: { deploymentTarget: "26.0" },
        },
      ],
    ],
    extra: {
      webUrl: WEB_URL,
      // App Store Connect 에서 앱 레코드를 만들면 숫자 ID 가 나온다. 출시 전에도
      // 정해지므로 그때 채우면 된다. 비어 있으면 스토어 대신 아무 일도 하지 않는다.
      appStoreId: process.env.APP_STORE_ID ?? "",
      apiUrl: process.env.API_URL ?? apiUrlFrom(WEB_URL),
    },
  },
};
