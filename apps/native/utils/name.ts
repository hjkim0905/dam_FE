const MAX_NAME = 12;

/** 상대에게 보일 이름. 빈 이름은 방에서 누가 누군지 알 수 없게 만든다. */
export function cleanName(raw: string, unnamed: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return unnamed;

  return trimmed.slice(0, MAX_NAME);
}
