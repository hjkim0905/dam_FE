import { BACKGROUND } from "./theme";

/* 기본값이 배포 주소여야 한다. 로컬만 가리키게 두면 .env 가 없는 곳에서 빌드한
   앱이 조용히 localhost 를 보러 가고, 그 사실이 흰 화면으로만 드러난다.
   .env 는 로컬에서 이 값을 덮는 용도로 쓴다. */
const WEB_URL = process.env.WEB_URL ?? "https://161.33.199.246.nip.io";

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
    name: "담.",
    slug: "dam",
    version: "1.0.1",
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
      "expo-localization",
      "./plugins/withKoreanProject",
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
      // 강제 업데이트 화면이 스토어를 여는 데 쓴다. 공개된 값이라 숨길 이유가 없다.
      appStoreId: process.env.APP_STORE_ID ?? "6809452180",
      // 담 전용 프로젝트의 키다. 처음 쓰던 키는 다른 서비스가 쓰던 것이라
      // 한 프로젝트에 두 서비스의 이벤트가 섞였다.
      //
      // 앱 번들에 실려 나가는 것이 정상인 공개 키다. 개발 중에 찍힌 이벤트가
      // 실제 데이터에 섞이지 않게 하는 일은 lib/analytics.ts 가 __DEV__ 로 맡는다.
      // 환경변수로만 두면 Xcode 가 셸 환경을 물려받지 않아 조용히 빈 값이 된다.
      posthogKey: process.env.POSTHOG_KEY ?? "phc_tfGuKJ5Eo4peZnxwvdLJfwPXjJTeBG6C5DXwprTJga5g",
      apiUrl: process.env.API_URL ?? apiUrlFrom(WEB_URL),
    },
  },
};
