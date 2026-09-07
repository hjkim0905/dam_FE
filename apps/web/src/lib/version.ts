/**
 * 앱 버전을 견준다. 문자열로 비교하면 "1.10.0" 이 "1.9.0" 보다 작다고 나온다.
 * 자리마다 숫자로 봐야 한다.
 */
export function isOlderThan(version: string, than: string): boolean {
  const mine = parts(version);
  const need = parts(than);

  for (let i = 0; i < Math.max(mine.length, need.length); i += 1) {
    const a = mine[i] ?? 0;
    const b = need[i] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}

// 자리에 숫자가 아닌 것이 오면 0 으로 본다. 버전을 못 읽었다고 사람을 막을 수는 없다.
function parts(version: string): number[] {
  return version.split('.').map((piece) => {
    const n = Number.parseInt(piece, 10);
    return Number.isNaN(n) ? 0 : n;
  });
}
