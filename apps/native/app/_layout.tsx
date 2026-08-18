import { NativeTabs } from "expo-router/unstable-native-tabs";
import { TINT } from "../theme";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={TINT}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "drop", selected: "drop.fill" }} />
        <NativeTabs.Trigger.Label>담</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="flow">
        <NativeTabs.Trigger.Icon sf="rainbow" />
        <NativeTabs.Trigger.Label>흐름</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
