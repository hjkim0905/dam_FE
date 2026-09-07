'use client';

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { EVENT } from '@/lib/analytics';
import { isNativeApp } from '@/lib/bridge';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * 자동 수집과 세션 리플레이를 켜 두되, 사진과 메모에는 `ph-no-capture` 를 붙여
 * 그 자리만 비워 둔다. 그 클래스 하나가 녹화와 오토캡처를 동시에 막는다.
 *
 * 이름 붙인 이벤트를 따로 보내는 것은 그대로다. 오토캡처가 주는 것은 "무엇이
 * 눌렸나" 이고, 우리가 알고 싶은 것은 "담았나" 라서 서로를 대신하지 못한다.
 */
export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!KEY || posthog.__loaded) return;

    posthog.init(KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      autocapture: true,
      capture_pageview: false,
      session_recording: {
        /* 메모칸은 그 사람의 하루라서 글자를 남기지 않는다. */
        maskAllInputs: true,
      },
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
