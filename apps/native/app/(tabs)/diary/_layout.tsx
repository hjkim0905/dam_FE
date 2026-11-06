import { Stack } from "expo-router";
import { useSyncExternalStore } from "react";
import { currentLocale } from "../../../lib/locale";
import { diaryBack, diaryButtons } from "../../../utils/menu";
import { currentDiaryBack, sendToWeb, subscribeDiaryBack } from "../../../utils/web-channel";

/**
 * 홈과 같은 투명 헤더에 왼쪽 버튼과 + 버튼. 둘 다 눌렸다는 사실만 웹에 보낸다.
 * 왼쪽 버튼을 웹이 그리면 헤더가 그 자리 터치를 가져가 눌리지 않고, + 와 높이도 맞지 않는다.
 */
export default function DiaryLayout() {
  const back = useSyncExternalStore(subscribeDiaryBack, currentDiaryBack);
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        title: "",
        unstable_headerLeftItems: () => diaryBack(sendToWeb, back),
        unstable_headerRightItems: () => diaryButtons(sendToWeb, currentLocale()),
      }}
    />
  );
}
