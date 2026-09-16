import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Entrance from "../components/Entrance";
import { ApiError, completeOnboarding } from "../lib/api";
import { EVENT, track } from "../lib/analytics";
import { loadToken } from "../lib/session";
import { strings } from "../lib/locale";
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
  const s = strings();

  useEffect(() => {
    track(EVENT.onboardingOpened);
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
        name: cleanName(name, s.unnamed),
        termsAgreed: terms,
        privacyAgreed: privacy,
      });
      track(EVENT.onboardingDone);
      router.replace("/home");
    } catch (error) {
      setWorking(false);
      setFailed(error instanceof ApiError ? error.message : s.tryLater);
    }
  };

  return (
    <Entrance
      title={s.askName}
      lead={s.nameLead}
      top={48}
      busy={working}
    >
      <View style={styles.body}>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME}
          placeholder={s.name}
          placeholderTextColor={FAINT}
          autoCorrect={false}
          style={styles.field}
        />

        <View style={styles.agreements}>
          <Agreement
            checked={terms}
            onChange={setTerms}
            label={s.agreeTerms}
            onRead={() => void Linking.openURL(DOCUMENTS.terms)}
          />
          <Agreement
            checked={privacy}
            onChange={setPrivacy}
            label={s.agreePrivacy}
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
          {s.start}
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
  const s = strings();

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
        <Text style={styles.read}>{s.read}</Text>
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
