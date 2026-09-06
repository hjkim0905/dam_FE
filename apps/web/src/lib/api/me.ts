import { clearSession } from '../session';
import { call } from './client';
import type { ProfileResponse } from './types';

export function fetchProfile(): Promise<ProfileResponse> {
  return call<ProfileResponse>('get', 'me');
}

export function renameMe(name: string): Promise<ProfileResponse> {
  return call<ProfileResponse>('patch', 'me', { json: { name } });
}

/** 서버가 다 지운 뒤에 토큰을 버린다. 먼저 버리면 요청을 보낼 수 없다. */
export async function withdraw(): Promise<void> {
  await call<void>('delete', 'me');
  clearSession();
}
