/**
 * 앱 밖 문서. 온보딩과 홈 메뉴 두 곳에서 같은 주소를 열어야 해서 여기 모은다.
 * 흩어 두면 주소가 바뀔 때 한쪽만 고치고 끝난다.
 *
 * TODO 실제 주소로 바꿔야 한다. 지금 값은 열리지 않는다(401).
 * 개인정보 처리방침 주소는 앱스토어 제출에 필수다.
 */
export const DOCUMENTS = {
  terms: "https://www.notion.so/dam-terms",
  privacy: "https://www.notion.so/dam-privacy",
  contact: "https://www.notion.so/dam-contact",
} as const;

export type DocumentKey = keyof typeof DOCUMENTS;
