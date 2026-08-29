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
