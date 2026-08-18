export type BridgeMessage = {
  type: string;
  payload?: unknown;
};

export const HAPTIC_STYLES = ["selection", "light", "medium"] as const;

export type HapticStyle = (typeof HAPTIC_STYLES)[number];

export type BridgeCommand =
  | { type: "PING" }
  | { type: "HAPTIC"; style: HapticStyle };

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

    case "HAPTIC": {
      const style = memberOf(HAPTIC_STYLES, fieldOf(message.payload, "style"));
      return style ? { type: "HAPTIC", style } : null;
    }

    default:
      return null;
  }
}
