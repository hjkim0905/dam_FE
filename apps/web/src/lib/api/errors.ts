/** 서버가 실패를 감쌀 때 쓰는 모양. 성공은 본문을 그대로 준다. */
export type ErrorBody = { code: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function hasCode(error: unknown, code: string): boolean {
  return isApiError(error) && error.code === code;
}

/**
 * 네트워크가 끊겼을 때도 화면은 무언가 말해야 한다. 코드가 없으면 프론트가
 * 분기할 수 없으므로 우리가 정한 코드를 붙여 준다.
 */
export const OFFLINE = 'OFFLINE';
export const UNREADABLE = 'UNREADABLE';

export function readErrorBody(body: unknown, status: number): ApiError {
  if (typeof body === 'object' && body !== null) {
    const { code, message } = body as Partial<ErrorBody>;
    if (typeof code === 'string' && typeof message === 'string') {
      return new ApiError(code, message, status);
    }
  }
  return new ApiError(UNREADABLE, '잠시 뒤에 다시 시도해 주세요', status);
}
