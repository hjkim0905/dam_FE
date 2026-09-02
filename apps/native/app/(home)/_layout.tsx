import { Stack } from "expo-router";
import { sendToWeb } from "../../utils/web-channel";

/**
 * 헤더는 제목을 그리지 않고 투명하게 둔다. 화면 제목은 웹이 갈무리로 그리므로
 * 네이티브가 또 그리면 두 겹이 되고, 네이티브에 맡기면 애플 폰트로 나온다.
 * 갈무리 예외는 탭바 하나뿐이다.
 *
 * 오른쪽 버튼은 진짜 UIBarButtonItem 이라 iOS 26 이 리퀴드글래스로 그려 준다.
 * 유리를 직접 만들지 않는 이 프로젝트의 규칙이 여기서도 지켜진다.
 */
export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        title: "",
        unstable_headerRightItems: () => [
          {
            type: "menu",
            label: "메뉴",
            // 여기 항목은 고르는 것이 아니라 여는 것이라 선택 상태를 갖지 않는다.
            changesSelectionAsPrimaryAction: false,
            icon: { type: "sfSymbol", name: "ellipsis" },
            menu: {
              // 최상위와 하위 메뉴가 각각 이 값을 본다. 한쪽만 주면 다른 쪽이
              // singleSelection 으로 남아 마지막에 누른 항목에 체크가 붙는다.
              multiselectable: true,
              items: [
                {
                  type: "action",
                  label: "내 정보",
                  state: "off",
                  onPress: () => sendToWeb("me"),
                },
                {
                  type: "action",
                  label: "방",
                  state: "off",
                  onPress: () => sendToWeb("room"),
                },
                {
                  type: "submenu",
                  label: "약관과 정책",
                  inline: true,
                  multiselectable: true,
                  items: [
                    {
                  type: "action",
                  label: "개인정보처리방침",
                  state: "off",
                  onPress: () => sendToWeb("privacy"),
                },
                    {
                  type: "action",
                  label: "이용약관",
                  state: "off",
                  onPress: () => sendToWeb("terms"),
                },
                    {
                  type: "action",
                  label: "문의하기",
                  state: "off",
                  onPress: () => sendToWeb("contact"),
                },
                  ],
                },
                {
                  type: "action",
                  label: "로그아웃",
                  state: "off",
                  onPress: () => sendToWeb("signOut"),
                },
                {
                  type: "action",
                  label: "회원탈퇴",
                  state: "off",
                  destructive: true,
                  onPress: () => sendToWeb("deleteAccount"),
                },
              ],
            },
          },
        ],
      }}
    />
  );
}
