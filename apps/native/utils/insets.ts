export type Insets = { top: number; bottom: number };

/**
 * WKWebView 는 첫 페인트 때 safe area inset 을 0 으로 보고했다가 레이아웃이 끝난 뒤
 * 실제 값으로 바꾼다. 그 사이 콘텐츠가 아래로 밀리므로, 네이티브가 이미 아는 값을
 * 문서가 열리기 전에 심어 준다. 웹은 이 변수가 없으면 env() 로 되돌아간다.
 *
 * DOM 대신 adoptedStyleSheets 에 넣는 이유: html 에 인라인 스타일을 붙이면 서버가
 * 보낸 HTML 과 달라져서 React 가 하이드레이션 불일치로 트리를 다시 그린다.
 */
export function insetVariablesScript({ top, bottom }: Insets): string {
  const px = (value: number) => `${Math.max(0, Math.round(value))}px`;
  const rule = `:root{--inset-top:${px(top)};--inset-bottom:${px(bottom)}}`;

  return `(function(){var s=new CSSStyleSheet();s.replaceSync('${rule}');document.adoptedStyleSheets=document.adoptedStyleSheets.concat(s);})();true;`;
}
