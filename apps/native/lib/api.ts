import Constants from "expo-constants";

const API_URL: string = Constants.expoConfig?.extra?.apiUrl;

export type Profile = {
  id: number;
  name: string | null;
  onboarded: boolean;
};

export type Session = {
  accessToken: string;
  user: Profile;
};

export class ApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function call<T>(path: string, init: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = init;
  let response: Response;

  try {
    response = await fetch(`${API_URL}/${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiError("OFFLINE", "연결을 확인해 주세요");
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return body as T;

  // 서버는 실패만 감싼다. 코드가 있어야 화면이 분기할 수 있다.
  const { code, message } =
    (body as { code?: string; message?: string } | null) ?? {};
  throw new ApiError(code ?? "UNREADABLE", message ?? "잠시 뒤에 다시 시도해 주세요");
}

export function signInWithApple(input: {
  identityToken: string;
  authorizationCode?: string;
  fullName?: string;
}) {
  return call<Session>("auth/apple", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchProfile(token: string) {
  return call<Profile>("me", { token });
}

export function completeOnboarding(
  token: string,
  input: { name: string; termsAgreed: boolean; privacyAgreed: boolean }
) {
  return call<Profile>("me/onboarding", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}
