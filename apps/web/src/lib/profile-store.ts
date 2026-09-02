import { cleanName } from './profile';
import type { Profile } from './profile';

/**
 * 계정이 붙기 전까지의 내 정보. 저장소를 아는 파일은 여기 하나뿐이라
 * 서버가 생기면 이 파일만 API 로 바꾼다. 기록 저장소와 같은 규칙이다.
 */
const STORAGE_KEY = 'dam.profile';

export function loadProfile(): Profile | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { name } = parsed as Record<string, unknown>;

    return typeof name === 'string' ? { name: cleanName(name) } : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: cleanName(profile.name) }));
    return true;
  } catch {
    return false;
  }
}

/** 회원탈퇴가 지우는 것. 계정이 붙으면 서버에도 같은 요청이 나가야 한다. */
export function forgetEverything(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem('dam.entries');
}
