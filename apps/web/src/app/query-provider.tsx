'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  /* 모듈 최상단에서 만들면 서버에서 한 번 만들어져 요청들이 같은 캐시를 나눠 쓴다. */
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /* 얼마나 오래 믿을지는 무엇을 받았느냐에 달려서 쿼리가 정한다(use-entries). */
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
