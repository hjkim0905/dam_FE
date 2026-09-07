/**
 * 앱 밖 문서. 온보딩과 홈 메뉴 두 곳에서 같은 주소를 열어야 해서 여기 모은다.
 * 흩어 두면 주소가 바뀔 때 한쪽만 고치고 끝난다.
 *
 * 노션에 공개 게시한 문서다. 앱스토어 심사는 이 주소를 익명으로 열어 보므로,
 * 게시를 내리면 그 자체로 리젝 사유가 된다.
 */
export const DOCUMENTS = {
  terms: "https://respected-island-cf3.notion.site/3d4b1e15f1e981558d4cfb88108acd37",
  privacy: "https://respected-island-cf3.notion.site/3d4b1e15f1e9810e86b1e3fd9a024941",
  contact: "https://respected-island-cf3.notion.site/3d4b1e15f1e98143a9c0f09330a6a49e",
} as const;

export type DocumentKey = keyof typeof DOCUMENTS;
