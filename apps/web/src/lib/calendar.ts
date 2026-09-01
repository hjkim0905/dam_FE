/**
 * 한 달을 요일 격자에 앉힌 모습. 앞의 빈칸은 1일이 무슨 요일에 시작하느냐로 정해진다.
 * 날짜 문자열을 Date 로 되돌리지 않는 이유: '2026-09-01' 은 UTC 로 해석되어
 * 시간대에 따라 하루가 밀린다. 연·월을 숫자로 넘겨 그 자리의 날짜로 만든다.
 */
export function monthCells(monthKey: string): (string | null)[] {
  const [year, month] = monthKey.split('-').map(Number);
  const leading = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();

  const cells: (string | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(`${monthKey}-${`${day}`.padStart(2, '0')}`);
  }
  return cells;
}
