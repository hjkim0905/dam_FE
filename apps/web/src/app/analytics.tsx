'use client';

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { EVENT } from '@/lib/analytics';
import { isNativeApp } from '@/lib/bridge';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * 자동 수집(autocapture)과 세션 리플레이를 둘 다 끈 채로 쓴다. 화면에 남의 사진과
 * 메모가 떠 있어서, DOM 을 통째로 긁는 기능은 그대로 유출이 된다. 대신 의미 있는
 * 순간마다 이름 붙은 이벤트를 직접 보낸다.
 */
export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!KEY || posthog.__loaded) return;

    posthog.init(KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
      capture_pageleave: true,
      /* 로그인 전에는 사람을 만들지 않는다. 웹뷰가 뜰 때마다 유령이 하나씩 생긴다. */
      person_profiles: 'identified_only',
      /* 웹뷰의 쿠키는 앱을 지우면 같이 날아가고 탭마다 어긋나기도 한다. */
      persistence: 'localStorage',
    });

    /* 모든 이벤트에 따라붙는다. 앱에서 본 것과 브라우저에서 본 것을 갈라 보려면
       이벤트마다 넣는 것이 아니라 여기서 한 번 등록해야 빠짐이 없다. */
    posthog.register({
      platform: isNativeApp() ? 'ios_app' : 'browser',
      app_version: window.__DAM_VERSION__ || null,
    });

    posthog.capture(EVENT.appOpened);
  }, []);

  return children;
}

/** App Router 는 화면을 옮겨도 페이지가 다시 뜨지 않아 직접 알려 줘야 한다. */
export function PageViews() {
  const pathname = usePathname();

  useEffect(() => {
    if (!posthog.__loaded) return;
    posthog.capture('$pageview', { $current_url: window.location.origin + pathname });
  }, [pathname]);

  return null;
}
