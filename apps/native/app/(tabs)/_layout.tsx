import { NativeTabs } from "expo-router/unstable-native-tabs";
import { strings } from "../../lib/locale";
import { TINT } from "../../theme";

export default function TabLayout() {
  const s = strings();

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={TINT}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: "drop", selected: "drop.fill" }} />
        <NativeTabs.Trigger.Label>{s.today}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Icon sf="calendar" />
        <NativeTabs.Trigger.Label>{s.calendar}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="flow">
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.stack", selected: "square.stack.fill" }}
        />
        <NativeTabs.Trigger.Label>{s.flow}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
