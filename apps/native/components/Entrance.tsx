import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingCapsule from "./LoadingCapsule";
import { BACKGROUND, FONT, MUTED, TINT } from "../theme";

/**
 * 로그인과 온보딩이 함께 쓰는 틀. 양모 테두리는 담은 것을 감싸는 틀이라 아직
 * 아무것도 담지 않은 이 구간에는 두지 않는다.
 */
export default function Entrance({
  title,
  titleSize = HEADING,
  lead,
  children,
  top,
  busy = false,
}: {
  title: string;
  /** 갈무리는 설계 크기 14px 이라 14 의 정수배만 또렷하다. */
  titleSize?: 28 | 56;
  lead?: string;
  children: ReactNode;
  top?: number;
  /** 서버를 기다리는 동안. 짧게 끝나면 나타나지 않는다. */
  busy?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    // 덮개를 padding 바깥에 두어야 화면 끝까지 덮는다. 안쪽에 두면 절대 위치가
    // padding 안쪽을 기준으로 잡혀서 위아래가 남는다.
    <View style={styles.root}>
      {/*
        키보드가 올라오면 iOS 가 스크롤뷰 여백을 알아서 밀어 준다. 직접 높이를
        재서 옮기면 키보드 종류(이모지, 자동완성 바)마다 값이 달라 어긋난다.

        keyboardShouldPersistTaps 가 없으면 키보드가 떠 있을 때 첫 탭이 키보드를
        내리는 데만 쓰이고 버튼이 안 눌린다.
      */}
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 },
        ]}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: top ?? 0 }}>
          <Text
            style={[
              styles.title,
              { fontSize: titleSize, letterSpacing: titleSize * -0.03 },
            ]}
          >
            {title}
          </Text>
          {lead !== undefined && <Text style={styles.lead}>{lead}</Text>}
        </View>
        <View style={styles.act}>{children}</View>
      </ScrollView>

      {busy && <LoadingCapsule />}
    </View>
  );
}

/* 다른 화면의 제목과 같은 크기. 워드마크만 그 두 배로 선다. */
const HEADING = 28;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  /* 스크롤뷰의 내용이라 flex 가 아니라 flexGrow 여야 화면을 채운다. */
  screen: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  title: { fontFamily: FONT, color: TINT },
  lead: { fontFamily: FONT, fontSize: 14, lineHeight: 28, color: MUTED, marginTop: 28 },
  act: { gap: 20 },
});
