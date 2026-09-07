import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs';
import { scrubUrl } from '@/lib/sentry';

/**
 * DSN 이 없으면 SDK 가 아무것도 보내지 않는다. 로컬과 CI 는 그래서 설정이 필요 없다.
 */
export const options = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? 'local',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  /* 오류만 본다. 추적까지 켜면 둘이 쓰는 앱으로 무료 할당량을 다 쓴다. */
  tracesSampleRate: 0,

  /* 담는 것이 사람의 하루라서 본문과 헤더를 실어 보내지 않는다. */
  sendDefaultPii: false,

  beforeBreadcrumb,
  beforeSend,
};

/**
 * 사진 주소의 쿼리에 스토리지 서명이 들어 있다. 오류 하나에 breadcrumb 이 수십 개씩
 * 붙으므로, 지우지 않으면 Sentry 를 보는 사람이 남의 사진을 그대로 열 수 있다.
 */
function beforeBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  const data = crumb.data;
  if (!data) return crumb;

  const scrubbed = { ...data };
  for (const key of ['url', 'from', 'to'] as const) {
    if (typeof scrubbed[key] === 'string') scrubbed[key] = scrubUrl(scrubbed[key]);
  }
  return { ...crumb, data: scrubbed };
}

function beforeSend(event: ErrorEvent): ErrorEvent {
  if (typeof event.request?.url !== 'string') return event;
  return { ...event, request: { ...event.request, url: scrubUrl(event.request.url) } };
}
