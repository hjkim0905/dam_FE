import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Entrance from "../components/Entrance";
import { ApiError, completeOnboarding } from "../lib/api";
import { loadToken } from "../lib/session";
import { DOCUMENTS } from "../utils/documents";
import { cleanName } from "../utils/name";
import { ALERT, BACKGROUND, FAINT, FONT, MUTED, TINT } from "../theme";

const MAX_NAME = 12;

export default function Onboarding() {
  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  const ready = name.trim().length > 0 && terms && privacy && !working;

  const submit = async () => {
    const token = await loadToken();
    if (token === null) {
      router.replace("/");
      return;
    }

    setWorking(true);
    setFailed(null);
    try {
      await completeOnboarding(token, {
        name: cleanName(name),
        termsAgreed: terms,
        privacyAgreed: privacy,
      });
      router.replace("/home");
    } catch (error) {
      setWorking(false);
      setFailed(error instanceof ApiError ? error.message : "잠시 뒤에 다시 시도해 주세요");
    }
  };

  return (
    <Entrance
      title="어떻게 부를까요"
      lead="같이 담을 사람에게 보이는 이름이에요"
      top={48}
      busy={working}
    >
      <View style={styles.body}>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME}
          placeholder="이름"
          placeholderTextColor={FAINT}
          autoCorrect={false}
          style={styles.field}
        />

        <View style={styles.agreements}>
          <Agreement
            checked={terms}
            onChange={setTerms}
            label="이용약관에 동의해요"
            onRead={() => void Linking.openURL(DOCUMENTS.terms)}
          />
          <Agreement
            checked={privacy}
            onChange={setPrivacy}
            label="개인정보 처리방침에 동의해요"
            onRead={() => void Linking.openURL(DOCUMENTS.privacy)}
          />
        </View>
      </View>

      <Pressable
        onPress={() => void submit()}
        disabled={!ready}
        style={({ pressed }) => [
          styles.start,
          !ready && styles.startOff,
          pressed && ready && styles.startPressed,
        ]}
      >
        <Text style={[styles.startLabel, !ready && styles.startLabelOff]}>
          시작하기
        </Text>
      </Pressable>

      {failed !== null && <Text style={styles.failed}>{failed}</Text>}
    </Entrance>
  );
}

function Agreement({
  checked,
  onChange,
  label,
  onRead,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  onRead: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      >
        {/* 갈무리에 있는 글자로 그린다. 아이콘을 쓰면 픽셀 글자 옆에서 튄다. */}
        <Text style={styles.mark}>{checked ? "■" : "□"}</Text>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      <Pressable onPress={onRead} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={styles.read}>보기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 40 },
  /* 밑줄 하나로 받는다. 상자를 두르면 이 화면에서 유일한 입력이라는 것이 흐려진다. */
  field: {
    fontFamily: FONT,
    fontSize: 28,
    color: TINT,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: FAINT,
  },
  agreements: { gap: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  box: { flexDirection: "row", alignItems: "center", gap: 12 },
  mark: { fontFamily: FONT, fontSize: 14, color: TINT },
  label: { fontFamily: FONT, fontSize: 14, color: TINT },
  read: { fontFamily: FONT, fontSize: 14, color: MUTED, textDecorationLine: "underline" },
  pressed: { opacity: 0.5 },
  start: {
    paddingVertical: 20,
    borderRadius: 32,
    backgroundColor: TINT,
    alignItems: "center",
  },
  startOff: { backgroundColor: FAINT },
  startPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  startLabel: { fontFamily: FONT, fontSize: 14, color: BACKGROUND },
  startLabelOff: { color: MUTED },
  failed: { fontFamily: FONT, fontSize: 14, color: ALERT, textAlign: "center" },
});
