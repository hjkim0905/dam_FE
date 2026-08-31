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
        if (message.type !== 'FOCUS') return;
        const root = tabRootFor(pathname);
        if (root) router.replace(root);
      }),
    [pathname, router]
  );

  return null;
}
