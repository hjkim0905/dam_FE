export type BridgeMessage = {
  type: string;
  payload?: unknown;
};

export const HAPTIC_STYLES = ["selection", "light", "medium"] as const;

export type HapticStyle = (typeof HAPTIC_STYLES)[number];

export type BridgeCommand =
  | { type: "PING" }
  | { type: "READY" }
  | { type: "HAPTIC"; style: HapticStyle }
  | { type: "OPEN_URL"; url: string }
  | { type: "SIGNED_OUT" }
  | { type: "OPEN_STORE" }
  | { type: "ASK_REVIEW" };

export function parseBridgeMessage(raw: string): BridgeMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { type } = parsed as { type?: unknown };
    if (typeof type !== "string") return null;
    return parsed as BridgeMessage;
  } catch {
    return null;
  }
}

function fieldOf(payload: unknown, key: string): unknown {
  if (typeof payload !== "object" || payload === null) return undefined;
  return (payload as Record<string, unknown>)[key];
}

function memberOf<T extends string>(
  allowed: readonly T[],
  value: unknown
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

export function decodeCommand(raw: string): BridgeCommand | null {
  const message = parseBridgeMessage(raw);
  if (!message) return null;

  switch (message.type) {
    case "PING":
      return { type: "PING" };

    // 웹이 첫 화면을 그릴 수 있게 됐다. 스플래시를 내려도 되는 시점이다.
    case "READY":
      return { type: "READY" };

    // 언제 물을지는 웹이 정하고, 창을 띄우는 것은 iOS 만 할 수 있다.
    case "ASK_REVIEW":
      return { type: "ASK_REVIEW" };

    case "HAPTIC": {
      const style = memberOf(HAPTIC_STYLES, fieldOf(message.payload, "style"));
      return style ? { type: "HAPTIC", style } : null;
    }

    // 로그아웃, 회원탈퇴, 그리고 토큰이 죽은 것을 웹이 먼저 알아채는 경우다.
    // 세션은 네이티브가 들고 있으므로 버리는 것도 네이티브가 한다.
    case "SIGNED_OUT":
      return { type: "SIGNED_OUT" };

    // 앱스토어는 웹뷰가 열 수 없다. 어느 앱인지 아는 것도 네이티브뿐이다.
    case "OPEN_STORE":
      return { type: "OPEN_STORE" };

    case "OPEN_URL": {
      const url = fieldOf(message.payload, "url");
      // 웹뷰가 보내는 문자열은 믿지 않는다. https 가 아닌 것을 그대로 열면
      // 앱이 의도하지 않은 스킴으로 끌려갈 수 있다.
      if (typeof url !== "string" || !url.startsWith("https://")) return null;

      return { type: "OPEN_URL", url };
    }

    default:
      return null;
  }
}
