/**
 * 사진 주소는 스토리지가 서명해 준 것이라, 쿼리에 든 서명만으로 파일이 열린다.
 * 오류 하나에 breadcrumb 이 수십 개씩 붙으므로 남는 자리가 많다. 경로는 남겨야
 * 어느 요청이 깨졌는지 알 수 있어서, 지우는 것은 쿼리와 조각뿐이다.
 */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}
