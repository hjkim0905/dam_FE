/** 서버 응답의 모양. 화면이 쓰는 도메인 타입과 일부러 분리한다. */

export type SessionResponse = {
  accessToken: string;
  expiresIn: number;
  user: { id: number; name: string | null; onboarded: boolean };
};

export type ProfileResponse = {
  id: number;
  name: string | null;
  onboarded: boolean;
  keptCount: number;
  firstKeptDate: string | null;
  room: {
    id: number;
    partner: { id: number; name: string } | null;
    joinedAt: string;
  } | null;
};

export type KeptResponse = {
  id: number;
  date: string;
  color: string;
  photoUrl: string;
  memo: string | null;
  author: { id: number; name: string };
};

export type EntriesResponse = { entries: KeptResponse[] };

export type UploadTicket = { photoKey: string; uploadUrl: string; expiresIn: number };

export type InviteIssued = { code: string; expiresAt: string };

export type JoinedRoom = {
  roomId: number;
  partner: { id: number; name: string } | null;
  joinedAt: string;
};
