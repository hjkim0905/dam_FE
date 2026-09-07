import ky from 'ky';
import { HTTPError, TimeoutError } from 'ky';
import type { Options } from 'ky';
import { currentZone } from '../timezone';
import { clearSession, loadToken } from '../session';
import { ApiError, OFFLINE, readErrorBody } from './errors';

declare global {
  interface Window {
    /** 네이티브가 웹뷰에 넣어 주는 서버 주소. 앱 안에서는 이것이 우선한다. */
    __DAM_API__?: string;
    /** 앱 버전. 서버가 낡은 앱을 가려내는 데 쓴다. */
    __DAM_VERSION__?: string;
  }
}

/**
 * 앱에서 열면 네이티브가 넣어 준 주소를 쓴다. LAN IP 가 바뀌어도 WEB_URL 하나만
 * 고치면 따라온다. 브라우저에서 열면 그 값이 없으므로 빌드 시점 설정으로 떨어진다.
 */
function baseUrl(): string {
  if (typeof window !== 'undefined' && window.__DAM_API__) return window.__DAM_API__;
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
}

/** 웹뷰 안에서 모바일 네트워크를 타므로 넉넉하되 무한정 기다리지는 않는다. */
const TIMEOUT_MS = 10_000;

/**
 * 재시도 대상 메서드는 ky 의 기본값을 그대로 둔다. POST 가 빠져 있는 것이 중요하다.
 * 방 참여를 다시 보내면 초대코드가 두 번 소비될 수 있고, 보내는 쪽이 서버의
 * 방어에 기댈 이유는 없다.
 */
const http = ky.create({
  // baseUrl 이 아니라 prefix 다. baseUrl 은 URL 해석 규칙을 그대로 따라서
  // 끝에 슬래시가 없으면 /api/v1 이 통째로 날아간다. prefix 는 슬래시로 이어 붙인다.
  prefix: baseUrl(),
  timeout: TIMEOUT_MS,
  retry: { limit: 2 },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = loadToken();
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
        // 서버가 낡은 앱을 가려내려면 어느 버전에서 왔는지 알아야 한다.
        const version = typeof window === 'undefined' ? undefined : window.__DAM_VERSION__;
        if (version) request.headers.set('X-App-Version', version);
        // 오늘이 언제인지는 서버가 아니라 이 사람이 선 자리가 정한다.
        const zone = currentZone();
        if (zone) request.headers.set('X-Timezone', zone);
      },
    ],
    afterResponse: [
      ({ response }) => {
        // 토큰이 죽었으면 들고 있어봐야 다음 요청도 같은 곳에서 막힌다.
        if (response.status === 401) clearSession();
      },
    ],
  },
});

/**
 * ky 는 HTTPError 를 던지기 전에 본문을 미리 읽어 `data` 에 담는다. 그래서
 * `response.json()` 을 다시 부르면 이미 읽혔다며 실패하고, 서버가 보낸 문구가
 * 통째로 사라진다. 반드시 `data` 에서 꺼내야 한다.
 */
export function asApiError(error: unknown): ApiError {
  if (error instanceof HTTPError) {
    return readErrorBody(error.data, error.response.status);
  }
  if (error instanceof TimeoutError) {
    return new ApiError(OFFLINE, '연결이 느려요. 잠시 뒤에 다시 시도해 주세요', 0);
  }
  return new ApiError(OFFLINE, '연결을 확인해 주세요', 0);
}

type Method = 'get' | 'post' | 'patch' | 'delete';

/**
 * 실패를 ApiError 하나로 좁히는 자리. 화면이 ky 의 예외 종류를 알 필요가 없다.
 * 경로는 prefixUrl 을 쓰므로 앞에 슬래시를 붙이지 않는다.
 */
export async function call<T>(method: Method, path: string, options?: Options): Promise<T> {
  try {
    const response = await http[method](path, options);
    // 204 는 본문이 없다. json() 을 부르면 거기서 터진다.
    return response.status === 204 ? (undefined as T) : await response.json<T>();
  } catch (error) {
    throw asApiError(error);
  }
}
