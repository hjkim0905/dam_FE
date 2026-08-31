import type { Entry } from './entries';

/**
 * 백엔드가 붙기 전까지의 저장소. 화면은 이 파일만 알고 있으므로
 * 나중에 API 로 바꿔도 호출부는 그대로 둔다.
 */
const STORAGE_KEY = 'dam.entries';

function isEntry(value: unknown): value is Entry {
  if (typeof value !== 'object' || value === null) return false;
  const { date, color, imageUrl, memo } = value as Record<string, unknown>;
  return (
    typeof date === 'string' &&
    typeof color === 'string' &&
    typeof imageUrl === 'string' &&
    typeof memo === 'string'
  );
}

export function parseEntries(raw: string | null): Entry[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function serializeEntries(entries: readonly Entry[]): string {
  return JSON.stringify(entries);
}

export function loadEntries(): Entry[] {
  if (typeof window === 'undefined') return [];
  return parseEntries(window.localStorage.getItem(STORAGE_KEY));
}

/** 사진까지 담기므로 용량이 찰 수 있다. 실패를 삼키면 사용자가 잃은 줄 모른다. */
export function saveEntries(entries: readonly Entry[]): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, serializeEntries(entries));
    return true;
  } catch {
    return false;
  }
}
