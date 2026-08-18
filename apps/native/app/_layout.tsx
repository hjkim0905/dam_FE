import { NativeTabs } from "expo-router/unstable-native-tabs";
import { TINT } from "../theme";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={TINT}>
      {/* iOS 는 탭 화면의 첫 스크롤뷰(=WebView)에 자동으로 inset 을 넣어 콘텐츠를 탭바
          위로 밀어낸다. 그러면 배경이 탭바 경계에서 끊기고 유리 밑에 비칠 것이 없어진다.
          여백은 웹이 --space-tabbar 로 직접 준다. */}
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: "drop", selected: "drop.fill" }} />
        <NativeTabs.Trigger.Label>담</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="flow" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf="rainbow" />
        <NativeTabs.Trigger.Label>흐름</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
