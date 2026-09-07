import type { ProfileResponse } from './api/types';

/**
 * 이름을 한곳에 모아 두는 이유는 오타 하나가 조용히 새 이벤트를 만들기 때문이다.
 * 대시보드에서는 그것이 "데이터가 없다"로 보이지, 오타로는 안 보인다.
 */
export const EVENT = {
  appOpened: 'app_opened',
  sessionExpired: 'session_expired',
  serverUnreachable: 'server_unreachable',
  updateRequired: 'update_required',
  storeOpened: 'store_opened',

  recordOpened: 'record_opened',
  photoPicked: 'photo_picked',
  colorPicked: 'color_picked',
  entryKept: 'entry_kept',
  entryFailed: 'entry_failed',

  calendarViewed: 'calendar_viewed',
  monthChanged: 'month_changed',
  yearChanged: 'year_changed',
  viewFiltered: 'view_filtered',
  dayOpened: 'day_opened',

  inviteIssued: 'invite_issued',
  inviteCopied: 'invite_copied',
  roomJoined: 'room_joined',
  roomJoinFailed: 'room_join_failed',
  roomLeft: 'room_left',

  nameChanged: 'name_changed',
  documentOpened: 'document_opened',
  signedOut: 'signed_out',
  accountDeleted: 'account_deleted',
} as const;

/**
 * 사람에게 붙는 속성. 이름은 넣지 않는다. 누가 몇 번 담았는지를 보려는 것이지
 * 누구인지를 보려는 것이 아니고, 서버 id 만으로도 갈라 보는 데 충분하다.
 */
export function personPropertiesOf(profile: ProfileResponse): Record<string, unknown> {
  return {
    kept_count: profile.keptCount,
    first_kept_date: profile.firstKeptDate,
    has_room: profile.room !== null,
    has_partner: profile.room?.partner != null,
  };
}

/**
 * 방을 그룹으로 둔다. 담은 둘이 한 방을 채우는 서비스라, 사람 단위로만 보면
 * "둘 다 담은 날이 얼마나 되나" 같은 것을 물어볼 수가 없다.
 */
export function roomGroupOf(
  profile: ProfileResponse
): { key: string; properties: Record<string, unknown> } | null {
  if (profile.room === null) return null;
  return {
    key: String(profile.room.id),
    properties: { has_partner: profile.room.partner != null },
  };
}

/** 메모는 길이만 남긴다. 본문은 그 사람의 하루라서 밖으로 나가면 안 된다. */
export function memoShape(memo: string | null): { has_memo: boolean; memo_length: number } {
  const written = memo?.trim() ?? '';
  return { has_memo: written.length > 0, memo_length: written.length };
}

const DAY = 24 * 60 * 60 * 1000;

/** 오늘을 담는 것과 지난 날을 채우는 것은 다른 행동이라 갈라서 센다. */
export function daysAgo(date: string, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(date)) / DAY);
}
