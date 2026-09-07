import Constants from "expo-constants";
import PostHog from "posthog-react-native";

/**
 * 담의 로그인과 온보딩은 통째로 네이티브에 있다. 웹에만 이벤트를 심으면
 * "설치했는데 로그인에서 멈춘 사람이 몇인가" 를 영영 모른다. 브릿지로 넘기는
 * 방법도 안 되는데, 그 시점엔 웹뷰가 아직 안 떠 있어서 정작 필요한 이벤트만
 * 못 넘기기 때문이다.
 */
export const EVENT = {
  launched: "app_launched",
  signInStarted: "sign_in_started",
  signInCancelled: "sign_in_cancelled",
  signInFailed: "sign_in_failed",
  signedIn: "signed_in",
  onboardingOpened: "onboarding_opened",
  onboardingDone: "onboarding_done",
  webUnreachable: "web_unreachable",
} as const;

const KEY: string = Constants.expoConfig?.extra?.posthogKey ?? "";

/** 키가 없으면 아무것도 만들지 않는다. 그것이 로컬의 기본값이다. */
export const posthog = KEY
  ? new PostHog(KEY, { host: "https://us.i.posthog.com" })
  : null;

/* JSON 으로 실려 나가는 값만 받는다. 객체를 넘기려다 그 안에 사진이나 메모가
   딸려 들어가는 것을 타입이 먼저 막는다. */
type Properties = Record<string, string | number | boolean | null>;

export function track(event: string, properties?: Properties): void {
  posthog?.capture(event, properties);
}

/**
 * 웹과 같은 서버 id 로 붙인다. 그래야 로그인 전 네이티브 화면과 로그인 뒤 웹
 * 화면이 한 사람으로 이어진다. 다른 id 를 쓰면 같은 사람이 둘로 세어진다.
 */
export function identify(id: string): void {
  posthog?.identify(id);
}

export function forget(): void {
  posthog?.reset();
}
