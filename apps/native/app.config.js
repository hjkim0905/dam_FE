import { BACKGROUND } from "./theme";

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
      bundleIdentifier: "com.company.dam",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // 없으면 사진 선택기를 띄우는 순간 iOS 가 앱을 종료한다.
        NSCameraUsageDescription: "오늘의 사진을 찍어 그날의 색을 담습니다.",
        NSPhotoLibraryUsageDescription:
          "앨범에서 고른 사진으로 그날의 색을 담습니다.",
      },
    },
    plugins: [
      "expo-router",
      "expo-splash-screen",
      [
        "expo-build-properties",
        {
          ios: { deploymentTarget: "26.0" },
        },
      ],
    ],
    extra: {
      webUrl: process.env.WEB_URL ?? "http://localhost:3000",
    },
  },
};
