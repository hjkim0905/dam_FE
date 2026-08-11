export type BridgeMessage = {
  type: string;
  payload?: unknown;
};

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

export async function handleBridgeMessage(
  message: BridgeMessage
): Promise<BridgeMessage | null> {
  switch (message.type) {
    case "PING":
      return { type: "PONG" };
    default:
      if (__DEV__) console.warn(`[bridge] unhandled message type: ${message.type}`);
      return null;
  }
}
