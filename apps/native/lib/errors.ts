/** 서버가 실패를 감쌀 때 쓰는 모양. 성공은 본문을 그대로 준다. */
export class ApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 세션을 버려도 되는 실패인지. 서버가 토큰을 거절한 경우에만 참이다.
 * 연결이 끊긴 것과 토큰이 죽은 것을 같이 다루면, 지하철에서 앱을 연 사람이
 * 저장된 토큰을 잃고 애플 로그인부터 다시 해야 한다.
 */
export function isSessionGone(error: unknown): boolean {
  return error instanceof ApiError && error.code === "UNAUTHENTICATED";
}
