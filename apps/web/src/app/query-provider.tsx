'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * 신선함은 이 값이 아니라 탭에 들어올 때의 무효화가 책임진다(use-focus-reload).
 * 그래서 한 화면에 머무는 동안은 넉넉히 캐시해도 낡은 것을 보여줄 일이 없고,
 * 달을 앞뒤로 넘길 때 이미 본 달을 다시 받지 않는다.
 */
const STALE_MS = 5 * 60 * 1000;

export default function QueryProvider({ children }: { children: ReactNode }) {
  /* 모듈 최상단에서 만들면 서버에서 한 번 만들어져 요청들이 같은 캐시를 나눠 쓴다. */
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_MS,
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
