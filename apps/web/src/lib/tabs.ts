const TAB_ROOTS = ['/', '/calendar', '/flow'] as const;

/**
 * 탭에 다시 들어왔을 때 돌아갈 첫 화면. 이미 첫 화면이면 null.
 * 탭마다 WebView 가 따로 살아 있어서, 다른 탭에 다녀와도 떠날 때의 화면이 그대로 남는다.
 */
export function tabRootFor(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (TAB_ROOTS.includes(path as (typeof TAB_ROOTS)[number])) return null;

  return (
    TAB_ROOTS.find((root) => root !== '/' && path.startsWith(`${root}/`)) ?? '/'
  );
}
