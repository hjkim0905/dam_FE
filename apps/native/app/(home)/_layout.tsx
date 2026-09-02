import { Stack } from "expo-router";
import { homeMenu } from "../../utils/menu";
import { sendToWeb } from "../../utils/web-channel";

/**
 * 헤더는 제목을 그리지 않고 투명하게 둔다. 화면 제목은 웹이 갈무리로 그리므로
 * 네이티브가 또 그리면 두 겹이 되고, 네이티브에 맡기면 애플 폰트로 나온다.
 * 갈무리 예외는 탭바 하나뿐이다.
 *
 * 오른쪽 버튼은 진짜 UIBarButtonItem 이라 iOS 26 이 리퀴드글래스로 그려 준다.
 */
export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        title: "",
        unstable_headerRightItems: () => homeMenu(sendToWeb),
      }}
    />
  );
}
