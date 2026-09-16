import type { NativeStackHeaderItem } from "expo-router/build/react-navigation/native-stack";
import { strings } from "../lib/i18n";
import type { Locale } from "../lib/i18n";

export type MenuAction = "me" | "room" | "privacy" | "terms" | "contact" | "signOut" | "deleteAccount";

/**
 * 헤더 메뉴의 내용. 화면이 아니라 여기 있는 이유는 아래 규칙을 테스트로 묶어 두기 위해서다.
 *
 * 라이브러리는 `singleSelection: !multiselectable` 로 뒤집어 넘기고, 그 계산을 최상위
 * 메뉴와 하위 메뉴에서 따로 한 번씩 한다. 한쪽만 빠뜨리면 UIMenu 가 마지막에 누른 항목에
 * 체크를 붙이는데, 여기 항목은 고르는 것이 아니라 여는 것이라 그러면 안 된다.
 */
export function homeMenu(
  select: (action: MenuAction) => void,
  locale: Locale,
): NativeStackHeaderItem[] {
  const s = strings(locale);
  const opens = (label: string, action: MenuAction) =>
    ({ type: "action", label, state: "off", onPress: () => select(action) }) as const;

  return [
    {
      type: "menu",
      label: s.menu,
      icon: { type: "sfSymbol", name: "ellipsis" },
      changesSelectionAsPrimaryAction: false,
      menu: {
        multiselectable: true,
        items: [
          opens(s.me, "me"),
          opens(s.room, "room"),
          {
            type: "submenu",
            label: s.termsAndPolicies,
            inline: true,
            multiselectable: true,
            items: [
              opens(s.privacy, "privacy"),
              opens(s.terms, "terms"),
              opens(s.contact, "contact"),
            ],
          },
          opens(s.signOut, "signOut"),
          { ...opens(s.deleteAccount, "deleteAccount"), destructive: true },
        ],
      },
    },
  ];
}
