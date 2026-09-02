/**
 * 메뉴에 체크가 붙지 않아야 한다. 라이브러리가 최상위와 하위에서 selection 을 따로
 * 계산해서, 한 곳만 빠뜨리면 마지막에 누른 항목에 체크가 남는다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { homeMenu } from "./menu";

type Any = Record<string, unknown>;

function everyMenu(items: readonly unknown[], found: Any[] = []): Any[] {
  for (const item of items as Any[]) {
    if (item.type === "menu") {
      const menu = item.menu as Any;
      found.push(menu);
      everyMenu(menu.items as unknown[], found);
    }
    if (item.type === "submenu") {
      found.push(item);
      everyMenu(item.items as unknown[], found);
    }
  }
  return found;
}

function everyAction(items: readonly unknown[], found: Any[] = []): Any[] {
  for (const item of items as Any[]) {
    if (item.type === "action") found.push(item);
    if (item.type === "menu") everyAction((item.menu as Any).items as unknown[], found);
    if (item.type === "submenu") everyAction(item.items as unknown[], found);
  }
  return found;
}

const menu = homeMenu(() => {});

test("모든 메뉴와 하위 메뉴가 선택을 끈다", () => {
  const menus = everyMenu(menu);

  assert.ok(menus.length >= 2, "최상위와 하위가 모두 잡혀야 한다");
  for (const m of menus) {
    assert.equal(m.multiselectable, true, `${m.label ?? "최상위"} 가 선택 메뉴로 남아 있다`);
  }
});

test("모든 항목이 꺼짐 상태다", () => {
  for (const action of everyAction(menu)) {
    assert.equal(action.state, "off", `${action.label} 이 켜짐 상태다`);
  }
});

test("고른 항목이 무엇인지 알려준다", () => {
  const picked: string[] = [];
  const chosen = homeMenu((action) => picked.push(action));

  for (const action of everyAction(chosen)) (action.onPress as () => void)();

  assert.deepEqual(picked, ["me", "room", "privacy", "terms", "contact", "signOut", "deleteAccount"]);
});

test("회원탈퇴만 되돌릴 수 없는 항목으로 표시된다", () => {
  const destructive = everyAction(menu).filter((a) => a.destructive === true);

  assert.deepEqual(destructive.map((a) => a.label), ["회원탈퇴"]);
});
