import { call } from './client';
import type { InviteIssued, JoinedRoom } from './types';

export function issueInvite(): Promise<InviteIssued> {
  return call<InviteIssued>('post', 'rooms/invites');
}

export function joinRoom(code: string): Promise<JoinedRoom> {
  return call<JoinedRoom>('post', 'rooms/join', { json: { code } });
}

export function leaveRoom(): Promise<void> {
  return call<void>('delete', 'rooms/me');
}
