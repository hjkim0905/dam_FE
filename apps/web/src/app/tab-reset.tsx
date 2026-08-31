'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { subscribeToNative } from '@/lib/bridge';
import { tabRootFor } from '@/lib/tabs';

export default function TabReset() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(
    () =>
      subscribeToNative((message) => {
        // BLUR 이 본 경로다. FOCUS 는 앱이 내려갔다 오는 등 BLUR 을 놓친 경우의 보험이고,
        // 이미 첫 화면이면 tabRootFor 가 null 을 주므로 두 번 일하지 않는다.
        if (message.type !== 'BLUR' && message.type !== 'FOCUS') return;
        const root = tabRootFor(pathname);
        if (root) router.replace(root);
      }),
    [pathname, router]
  );

  return null;
}
