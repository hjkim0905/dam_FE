import { Stack } from "expo-router";
import { currentLocale } from "../../../lib/locale";
import { diaryButtons } from "../../../utils/menu";
import { sendToWeb } from "../../../utils/web-channel";

/** 홈과 같은 투명 헤더에 + 버튼 하나. 눌렸다는 사실만 웹에 보낸다. */
export default function DiaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        title: "",
        unstable_headerRightItems: () => diaryButtons(sendToWeb, currentLocale()),
      }}
    />
  );
}
