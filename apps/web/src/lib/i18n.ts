import type { Company } from './entries';

export type Locale = 'ko' | 'en' | 'ja';

/**
 * 모르는 언어는 한국어가 아니라 영어로 떨어뜨린다. 한국어를 기본으로 두면
 * 바깥에서 온 사람이 읽을 수 없는 화면을 보고 그대로 나간다.
 */
export function pickLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === 'ko') return 'ko';
    if (base === 'en') return 'en';
    if (base === 'ja') return 'ja';
  }
  return 'en';
}

/* as const 를 붙이면 값이 리터럴 타입으로 굳어 영어 사전이 들어가지 못한다.
   여기서 필요한 것은 값이 아니라 키의 모양이다. */
const KO = {
  title: '담. — 하루를 색으로 담다',
  description: '사진 한 장으로 오늘 하루를 색 하나로 기록하세요.',

  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
  pickMonth: '년월 고르기',
  openDay: (date: string) => `${date} 기록 보기`,
  dayRecord: (date: string) => `${date} 기록`,
  changeMonth: (title: string) => `${title}, 다른 달 고르기`,
  photoOn: (date: string, mine: boolean) => `${date} ${mine ? '내' : '상대'} 사진`,
  pickYear: '해 고르기',
  yearSuffix: '년',
  monthSuffix: '월',

  whoseRecords: '누구의 기록을 볼지',
  company: { mine: '내것', both: '함께', theirs: '상대것' } as Record<Company, string>,
  mineShort: '내',
  theirsShort: '상대',
  keptByMe: '내가',
  keptByThem: '상대가',
  keptSuffix: '담은',

  nothingKept: '아직 담은 색이 없어요',
  flowTitle: (year: number) => `${year}년의 흐름`,
  flowAria: (year: number) => `${year}년의 흐름, 다른 해 고르기`,
  colorsKept: (n: number) => `${n}가지 색`,
  colorsKeptAria: (year: number, n: number) => `${year}년에 담은 ${n}가지 색`,
  keptBy: (mine: boolean): string => (mine ? '내가 담은' : '상대가 담은'),
  keptByAria: (mine: boolean): string => (mine ? '내가 담은 것' : '상대가 담은 것'),
  photoAlt: (date: string, mine: boolean) =>
    `${date} ${mine ? '내가' : '상대가'} 담은 사진`,
  colorOf: (mine: boolean): string => (mine ? '내가 담은 색' : '상대가 담은 색'),
  loadFailed: '기록을 불러오지 못했어요',
  unreachable: '연결이 닿지 않아요',
  colorsAreSafe: '담아둔 색은 그대로 있어요.',
  checkConnection: '연결을 확인하고 다시 시도해 주세요.',
  retry: '다시 시도',
  retrying: '연결하는 중',
  updateReady: '새 버전이 나왔어요',
  updateToKeep: '앱을 업데이트하면 이어서 담을 수 있어요.',
  update: '업데이트하기',

  keepToday: '오늘의 색 담기',
  colorsOfMonth: (month: string) => `${month}의 색`,
  dropsKept: (n: number) => `${n}방울의 기록`,
  colorOnDay: (date: string) => `${date}의 색`,
  readingPhoto: '사진을 읽고 있어요',
  loading: '불러오는 중이에요',
  somethingBroke: '잠시 문제가 생겼어요',
  reopenApp: '앱을 다시 열어 주세요.',
  photoOfToday: '오늘 담은 사진',
  pickFromAlbum: '찍거나 앨범에서 고르세요',
  onePhotoToday: '오늘의 사진 한 장',
  rubToPick: '사진을 문질러 오늘의 색을 고르세요',
  memoPlaceholder: '이 색에 담을 한 줄',
  keep: '담기',
  keepFailed: '담지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
  photoFailed: '사진을 읽지 못했어요. 다른 사진을 골라 주세요.',

  room: '방',
  alone: '아직 혼자 담고 있어요.',
  withPartner: (name: string) => `${name}님과 함께 담고 있어요.`,
  makeInvite: '초대 코드 만들기',
  sendCode: '이 코드를 상대에게 보내 주세요',
  codeExpires: '하루가 지나면 코드가 만료돼요.',
  copyCode: '코드 복사하기',
  copied: '복사했어요',
  copyFailed: '복사하지 못했어요. 코드를 직접 옮겨 적어 주세요',
  or: '또는',
  receivedCode: '받은 초대코드',
  sixDigits: '여섯 자리',
  needSixDigits: '여섯 자리를 채워 주세요',
  joinWithCode: '이 코드로 들어가기',
  leaveRoom: '방 나가기',
  tryLater: '잠시 뒤에 다시 시도해 주세요',

  me: '내 정보',
  name: '이름',
  nameHint: '상대에게 보일 이름',
  keptColors: '담은 색',
  countOfColors: (n: number) => `${n}가지`,
  firstKept: '처음 담은 날',
  none: '아직 없어요',

  signOut: '로그아웃',
  signOutBody: '담은 기록은 그대로 남아요. 다시 로그인하면 이어서 담을 수 있어요.',
  deleteAccount: '회원탈퇴',
  deleteAccountBody: '지금까지 담은 색과 사진, 메모가 모두 지워져요. 되돌릴 수 없어요.',
  deleteAll: '모두 지우기',
};

/* 영어 사전에 키가 빠지면 여기서 타입이 깨진다. 문구를 늘리고 번역을 잊는
   사고를 사람이 아니라 컴파일러가 막는다. */
const EN: typeof KO = {
  title: 'dam. — a day in one color',
  description: 'Keep each day as a single color, taken from one photo.',

  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  pickMonth: 'Choose a month',
  openDay: (date: string) => `Open ${date}`,
  dayRecord: (date: string) => `${date}`,
  changeMonth: (title: string) => `${title}, choose another month`,
  photoOn: (date: string, mine: boolean) =>
    `${mine ? 'My' : 'Their'} photo on ${date}`,
  pickYear: 'Choose a year',
  yearSuffix: '',
  monthSuffix: '',

  whoseRecords: 'Whose days to show',
  company: { mine: 'Mine', both: 'Both', theirs: 'Theirs' } as Record<Company, string>,
  mineShort: 'Me',
  theirsShort: 'Them',
  keptByMe: 'I',
  keptByThem: 'They',
  keptSuffix: 'kept',

  nothingKept: 'No colors kept yet',
  flowTitle: (year: number) => `${year} in flow`,
  flowAria: (year: number) => `${year} in flow, choose another year`,
  colorsKept: (n: number) => `${n} colors`,
  colorsKeptAria: (year: number, n: number) => `${n} colors kept in ${year}`,
  keptBy: (mine: boolean): string => (mine ? 'I kept' : 'They kept'),
  keptByAria: (mine: boolean): string => (mine ? 'What I kept' : 'What they kept'),
  photoAlt: (date: string, mine: boolean) =>
    `Photo ${mine ? 'I' : 'they'} kept on ${date}`,
  colorOf: (mine: boolean): string => (mine ? 'The color I kept' : 'The color they kept'),
  loadFailed: "Couldn't load your days",
  unreachable: "Can't reach the server",
  colorsAreSafe: 'The colors you kept are safe.',
  checkConnection: 'Check your connection and try again.',
  retry: 'Try again',
  retrying: 'Connecting',
  updateReady: 'A new version is out',
  updateToKeep: 'Update the app to keep going.',
  update: 'Update',

  keepToday: "Keep today's color",
  colorsOfMonth: (month: string) => `Colors of ${month}`,
  dropsKept: (n: number) => `${n} drops kept`,
  colorOnDay: (date: string) => `Color on ${date}`,
  readingPhoto: 'Reading the photo',
  loading: 'Loading',
  somethingBroke: 'Something went wrong',
  reopenApp: 'Please open the app again.',
  photoOfToday: "Today's photo",
  pickFromAlbum: 'Take one, or pick from your album',
  onePhotoToday: 'One photo from today',
  rubToPick: "Rub the photo to pick today's color",
  memoPlaceholder: 'A line for this color',
  keep: 'Keep',
  keepFailed: "Couldn't keep it. Please try again in a moment.",
  photoFailed: "Couldn't read that photo. Try another one.",

  room: 'Room',
  alone: "You're keeping days on your own.",
  withPartner: (name: string) => `You and ${name} are keeping days together.`,
  makeInvite: 'Create an invite code',
  sendCode: 'Send this code to the other person',
  codeExpires: 'The code expires after a day.',
  copyCode: 'Copy the code',
  copied: 'Copied',
  copyFailed: "Couldn't copy. Please write the code down instead",
  or: 'or',
  receivedCode: 'Invite code you received',
  sixDigits: 'Six digits',
  needSixDigits: 'Enter all six digits',
  joinWithCode: 'Join with this code',
  leaveRoom: 'Leave the room',
  tryLater: 'Please try again in a moment',

  me: 'Me',
  name: 'Name',
  nameHint: 'The name the other person sees',
  keptColors: 'Colors kept',
  countOfColors: (n: number) => `${n}`,
  firstKept: 'First day kept',
  none: 'Not yet',

  signOut: 'Sign out',
  signOutBody: 'Your days stay as they are. Sign in again to keep going.',
  deleteAccount: 'Delete account',
  deleteAccountBody:
    'Every color, photo and note you kept will be erased. This cannot be undone.',
  deleteAll: 'Erase everything',
};

const JA: typeof KO = {
  title: '담. — 一日をひとつの色に',
  description: '写真一枚から、今日をひとつの色で残します。',

  weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  pickMonth: '年月を選ぶ',
  openDay: (date: string) => `${date}の記録を見る`,
  dayRecord: (date: string) => `${date}の記録`,
  changeMonth: (title: string) => `${title}、別の月を選ぶ`,
  photoOn: (date: string, mine: boolean) => `${date} ${mine ? '自分' : '相手'}の写真`,
  pickYear: '年を選ぶ',
  yearSuffix: '年',
  monthSuffix: '月',

  whoseRecords: 'どちらの記録を見るか',
  company: { mine: '自分', both: 'ふたり', theirs: '相手' } as Record<Company, string>,
  mineShort: '自分',
  theirsShort: '相手',
  keptByMe: '自分が',
  keptByThem: '相手が',
  keptSuffix: '残した',

  nothingKept: 'まだ残した色がありません',
  flowTitle: (year: number) => `${year}年の流れ`,
  flowAria: (year: number) => `${year}年の流れ、別の年を選ぶ`,
  colorsKept: (n: number) => `${n}色`,
  colorsKeptAria: (year: number, n: number) => `${year}年に残した${n}色`,
  keptBy: (mine: boolean): string => (mine ? '自分が残した' : '相手が残した'),
  keptByAria: (mine: boolean): string => (mine ? '自分が残したもの' : '相手が残したもの'),
  photoAlt: (date: string, mine: boolean) =>
    `${date}に${mine ? '自分' : '相手'}が残した写真`,
  colorOf: (mine: boolean): string => (mine ? '自分が残した色' : '相手が残した色'),
  loadFailed: '記録を読み込めませんでした',
  unreachable: '接続できません',
  colorsAreSafe: '残した色はそのままです。',
  checkConnection: '接続を確かめて、もう一度お試しください。',
  retry: 'もう一度',
  retrying: '接続しています',
  updateReady: '新しいバージョンがあります',
  updateToKeep: 'アップデートすると続けて残せます。',
  update: 'アップデート',

  keepToday: '今日の色を残す',
  colorsOfMonth: (month: string) => `${month}の色`,
  dropsKept: (n: number) => `${n}滴の記録`,
  colorOnDay: (date: string) => `${date}の色`,
  readingPhoto: '写真を読んでいます',
  loading: '読み込んでいます',
  somethingBroke: '問題が起きました',
  reopenApp: 'アプリを開き直してください。',
  photoOfToday: '今日の写真',
  pickFromAlbum: '撮るか、アルバムから選んでください',
  onePhotoToday: '今日の写真一枚',
  rubToPick: '写真をこすって今日の色を選んでください',
  memoPlaceholder: 'この色に添える一行',
  keep: '残す',
  keepFailed: '残せませんでした。少し経ってからお試しください。',
  photoFailed: '写真を読めませんでした。別の写真を選んでください。',

  room: '部屋',
  alone: 'まだひとりで残しています。',
  withPartner: (name: string) => `${name}さんと一緒に残しています。`,
  makeInvite: '招待コードをつくる',
  sendCode: 'このコードを相手に送ってください',
  codeExpires: '一日が過ぎるとコードは期限切れになります。',
  copyCode: 'コードをコピー',
  copied: 'コピーしました',
  copyFailed: 'コピーできませんでした。コードを書き写してください',
  or: 'または',
  receivedCode: '受け取った招待コード',
  sixDigits: '六桁',
  needSixDigits: '六桁を入力してください',
  joinWithCode: 'このコードで入る',
  leaveRoom: '部屋を出る',
  tryLater: '少し経ってからお試しください',

  me: '自分の情報',
  name: '名前',
  nameHint: '相手に見える名前',
  keptColors: '残した色',
  countOfColors: (n: number) => `${n}色`,
  firstKept: 'はじめて残した日',
  none: 'まだありません',

  signOut: 'ログアウト',
  signOutBody: '残した記録はそのままです。ログインし直せば続けて残せます。',
  deleteAccount: '退会',
  deleteAccountBody: 'これまでに残した色と写真、メモがすべて消えます。元に戻せません。',
  deleteAll: 'すべて消す',
};

/**
 * 사전은 그리는 순간에 꺼낸다. 모듈 최상단에서 읽으면 파일을 불러오는 시점에
 * 한 번 굳어, 서버에서 그린 것과 브라우저에서 그린 것이 어긋난다.
 */
export function strings(locale?: Locale): typeof KO {
  const chosen = locale ?? currentLocale();
  if (chosen === 'ko') return KO;
  if (chosen === 'ja') return JA;
  return EN;
}

export function currentLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ko';
  return pickLocale(navigator.languages ?? [navigator.language]);
}
