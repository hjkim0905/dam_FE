export type Locale = "ko" | "en" | "ja";

/**
 * 모르는 언어는 한국어가 아니라 영어로 떨어뜨린다. 한국어를 기본으로 두면
 * 바깥에서 온 사람이 로그인 화면부터 읽지 못한다.
 */
export function pickLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const base = tag.toLowerCase().split("-")[0];
    if (base === "ko") return "ko";
    if (base === "en") return "en";
    if (base === "ja") return "ja";
  }
  return "en";
}

const KO = {
  appName: "담.",
  lead: "하루 사진 한 장에서\n색 하나를 담아요",
  agreeNote: "계속하면 약관과 개인정보 처리방침에\n동의하게 돼요",
  signInUnconfirmed: "로그인을 확인하지 못했어요",
  unreachableOnLaunch: "연결이 닿지 않아요. 잠시 뒤에 다시 열어 주세요",
  tryLater: "잠시 뒤에 다시 시도해 주세요",

  askName: "어떻게 부를까요",
  nameLead: "같이 담을 사람에게 보이는 이름이에요",
  name: "이름",
  agreeTerms: "이용약관에 동의해요",
  agreePrivacy: "개인정보 처리방침에 동의해요",
  read: "보기",
  start: "시작하기",

  unreachable: "연결이 닿지 않아요",
  unreachableBody: "담아둔 색은 그대로 있어요.\n연결을 확인하고 다시 시도해 주세요.",
  retry: "다시 시도",

  menu: "메뉴",
  me: "내 정보",
  room: "방",
  termsAndPolicies: "약관과 정책",
  privacy: "개인정보처리방침",
  terms: "이용약관",
  contact: "문의와 연락처",
  signOut: "로그아웃",
  deleteAccount: "회원탈퇴",
  loading: "불러오는 중이에요",
  today: "오늘",
  calendar: "달력",
  flow: "흐름",
  unnamed: "이름 없음",
  checkConnection: "연결을 확인해 주세요",
};

/* 영어 사전에 키가 빠지면 여기서 타입이 깨진다. */
const EN: typeof KO = {
  appName: "dam.",
  lead: "One photo a day,\none color to keep",
  agreeNote: "By continuing you agree to the terms\nand the privacy policy",
  signInUnconfirmed: "Couldn't confirm that sign-in",
  unreachableOnLaunch: "Can't reach the server. Please open the app again in a moment",
  tryLater: "Please try again in a moment",

  askName: "What should we call you",
  nameLead: "The name the person you share with will see",
  name: "Name",
  agreeTerms: "I agree to the terms of service",
  agreePrivacy: "I agree to the privacy policy",
  read: "Read",
  start: "Start",

  unreachable: "Can't reach the server",
  unreachableBody: "The colors you kept are safe.\nCheck your connection and try again.",
  retry: "Try again",

  menu: "Menu",
  me: "Me",
  room: "Room",
  termsAndPolicies: "Terms and policies",
  privacy: "Privacy policy",
  terms: "Terms of service",
  contact: "Contact",
  signOut: "Sign out",
  deleteAccount: "Delete account",
  loading: "Loading",
  today: "Today",
  calendar: "Calendar",
  flow: "Flow",
  unnamed: "No name",
  checkConnection: "Check your connection",
};

/* 日本語. */
const JA: typeof KO = {
  appName: "담.",
  lead: "一日の写真一枚から\n色をひとつ残します",
  agreeNote: "続けると利用規約とプライバシーポリシーに\n同意したことになります",
  signInUnconfirmed: "ログインを確認できませんでした",
  unreachableOnLaunch: "接続できません。少し経ってから開いてください",
  tryLater: "少し経ってからお試しください",

  askName: "何とお呼びしましょう",
  nameLead: "一緒に残す人に見える名前です",
  name: "名前",
  agreeTerms: "利用規約に同意します",
  agreePrivacy: "プライバシーポリシーに同意します",
  read: "見る",
  start: "はじめる",

  unreachable: "接続できません",
  unreachableBody: "残した色はそのままです。\n接続を確かめて、もう一度お試しください。",
  retry: "もう一度",

  menu: "メニュー",
  me: "自分の情報",
  room: "部屋",
  termsAndPolicies: "規約とポリシー",
  privacy: "プライバシーポリシー",
  terms: "利用規約",
  contact: "お問い合わせ",
  signOut: "ログアウト",
  deleteAccount: "退会",
  loading: "読み込んでいます",
  today: "今日",
  calendar: "カレンダー",
  flow: "流れ",
  unnamed: "名前なし",
  checkConnection: "接続を確かめてください",
};

export function strings(locale: Locale): typeof KO {
  if (locale === "ko") return KO;
  if (locale === "ja") return JA;
  return EN;
}
