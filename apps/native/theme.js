/**
 * 네이티브가 그리는 색. 웹의 globals.css `--color-background` 와 같은 값이어야 한다.
 * 웹이 뜨기 전과 safe area 바깥을 이 색이 채우므로, 어긋나면 경계에서 화면이 끊긴다.
 */
export const BACKGROUND = "#FFFFFF";

/** 웹 globals.css 의 `--color-muted` 와 같은 값. 로딩 문구가 두 쪽에서 같아야 한다. */
export const MUTED = "#8B8B8B";

/** 선택된 탭 색. 기록한 색들과 경쟁하지 않도록 무채색으로 둔다. */
export const TINT = "#1A1918";
