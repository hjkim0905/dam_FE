export type Profile = { name: string };

const UNNAMED = '이름 없음';
const MAX_NAME = 12;

/** 상대에게 보일 이름. 빈 이름은 방에서 누가 누군지 알 수 없게 만든다. */
export function cleanName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) return UNNAMED;

  return trimmed.slice(0, MAX_NAME);
}

/** 코드를 읽어 주고받는 일이 많아 헷갈리는 글자는 뺀다. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export function isInviteCode(raw: string): boolean {
  const code = raw.trim().toUpperCase();
  if (code.length !== CODE_LENGTH) return false;

  return [...code].every((c) => ALPHABET.includes(c));
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
