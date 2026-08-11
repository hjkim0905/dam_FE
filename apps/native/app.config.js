import "dotenv/config";

export default {
  expo: {
    name: "담",
    slug: "dam",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "dam",
    platforms: ["ios"],
    ios: {
      buildNumber: "1",
      supportsTablet: false,
      bundleIdentifier: "com.company.dam",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: ["expo-splash-screen"],
    extra: {
      webUrl: process.env.WEB_URL ?? "http://localhost:3000",
    },
  },
};
