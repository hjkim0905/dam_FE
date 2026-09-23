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
            /* 기본값은 브라우저가 끊겼다고 하면 요청을 보류하는데, 그러면 오류도 나지
               않아 화면이 빈 채로 남는다. 끊긴 것을 말해 주는 일은 이미 ApiError 가
               하고 있으므로(lib/api/errors.ts) 언제든 보내고 실패를 받는다. */
            networkMode: 'always',
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
