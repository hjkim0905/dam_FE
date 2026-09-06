'use client';

import { useEffect } from 'react';
import { subscribeToNative } from '@/lib/bridge';

/** 탭에 들어올 때마다 다시 읽는다. 세 화면이 같은 일을 하므로 여기 한 번만 적는다. */
export default function useFocusReload(load: () => void, refresh: () => Promise<void>) {
  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type !== 'FOCUS') return;
        load();
        void refresh();
      }),
    [load, refresh]
  );
}
