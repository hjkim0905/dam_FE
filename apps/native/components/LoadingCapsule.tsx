import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { BACKGROUND, MUTED } from "../theme";

const APPEAR_AFTER_MS = 200;

/** 웹이 도착하기 전 구간. 웹의 로딩과 같은 규칙으로 짧은 기다림에는 나타나지 않는다. */
export default function LoadingCapsule() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), APPEAR_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.sheet}>
      {visible && (
        <>
          <Image
            source={require("../assets/loading-capsule.webp")}
            style={styles.capsule}
            contentFit="contain"
          />
          <Text style={styles.label}>불러오는 중이에요</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: BACKGROUND,
  },
  capsule: { width: 64, height: 64 },
  label: { fontSize: 13, color: MUTED },
});
