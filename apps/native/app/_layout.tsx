import { NativeTabs } from "expo-router/unstable-native-tabs";
import { TINT } from "../theme";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={TINT}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: "drop", selected: "drop.fill" }} />
        <NativeTabs.Trigger.Label>오늘</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Icon sf="calendar" />
        <NativeTabs.Trigger.Label>달력</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="flow">
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.stack", selected: "square.stack.fill" }}
        />
        <NativeTabs.Trigger.Label>흐름</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
