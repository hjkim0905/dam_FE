import { Pressable, StyleSheet, Text, View } from "react-native";
import { BACKGROUND, FAINT, FONT, MUTED, TINT } from "../theme";

/**
 * 웹뷰가 페이지 자체를 못 불러왔을 때. 여기까지 오면 웹의 코드는 한 줄도 돌지
 * 않으므로 웹의 같은 화면이 대신해 줄 수 없다. 두면 iOS 가 영문 오류 페이지를
 * 그리는데, 그 순간 앱이 아니라 브라우저로 보인다.
 */
export default function Unreachable({ onRetry }: { onRetry: () => void }) {
  return (
    // 웹뷰가 오류 화면을 어디에 끼워 넣든 화면을 꽉 채워야 가운데가 가운데가 된다.
    // 안전영역만큼 비키지는 않는다. 글 뭉치가 작아 가장자리에 닿을 일이 없고,
    // 위아래로 다르게 비키면 그만큼 가운데가 아니게 된다.
    <View style={styles.screen}>
      <Text style={styles.heading}>연결이 닿지 않아요</Text>
      <Text style={styles.body}>
        담아둔 색은 그대로 있어요.{"\n"}연결을 확인하고 다시 시도해 주세요.
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
      >
        <Text style={styles.retryLabel}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 24,
    backgroundColor: BACKGROUND,
  },
  // 갈무리에 볼드가 없어 위계는 굵기가 아니라 크기로 준다. 14 의 배수라야
  // 픽셀 격자가 또렷하다.
  heading: { fontFamily: FONT, fontSize: 28, color: TINT, textAlign: "center" },
  body: { fontFamily: FONT, fontSize: 14, lineHeight: 22, color: MUTED, textAlign: "center" },
  retry: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: FAINT,
    borderRadius: 999,
  },
  retryPressed: { borderColor: MUTED, transform: [{ scale: 0.96 }] },
  retryLabel: { fontFamily: FONT, fontSize: 14, color: TINT },
});
