'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { subscribeToNative } from '@/lib/bridge';
import { ENTRIES } from '@/lib/query-keys';
import { useSession } from './session';

/**
 * 탭에 들어올 때마다 다시 읽는다. 세 화면이 같은 일을 하므로 여기 한 번만 적는다.
 *
 * 돌려주는 함수는 실패 화면의 재시도가 쓴다. 다시 읽는 방법이 두 군데로 갈리면
 * 한쪽만 고쳐 놓고 나머지가 조용히 어긋난다.
 */
export default function useFocusReload(onFocus?: () => void) {
  const client = useQueryClient();
  const { refresh } = useSession();

  const reload = useCallback(
    () => void client.invalidateQueries({ queryKey: ENTRIES }),
    [client]
  );

  useEffect(
    () =>
      subscribeToNative((message) => {
        if (message.type !== 'FOCUS') return;
        reload();
        void refresh();
        onFocus?.();
      }),
    [reload, refresh, onFocus]
  );

  return reload;
}
