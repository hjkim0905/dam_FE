/** @jsxImportSource @emotion/react */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { isSessionGone, needsUpdate } from '@/lib/api/errors';
import { fetchProfile } from '@/lib/api/me';
import type { ProfileResponse } from '@/lib/api/types';
import { openStore, ready, signedOut } from '@/lib/bridge';
import { clearSession, loadToken } from '@/lib/session';
import Unreachable from './unreachable';
import UpdateRequired from './update-required';

type Session = {
  profile: ProfileResponse;
  /** 서버의 내 id. 어느 기록이 내 것인지 가릴 때 쓴다. */
  me: string;
  refresh: () => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error('세션 밖에서 useSession 을 불렀다');
  }
  return session;
}

/**
 * 탭 안의 화면들이 기대는 관문. 로그인과 온보딩은 네이티브에 있으므로 여기서는
 * 그리지 않는다. 세션이 끊긴 것을 알아채면 네이티브에 알리고, 어디로 갈지는
 * 토큰을 들고 있는 네이티브가 정한다.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [outdated, setOutdated] = useState(false);

  const leave = useCallback(() => {
    clearSession();
    setProfile(null);
    signedOut();
  }, []);

  const refresh = useCallback(async () => {
    if (loadToken() === null) {
      leave();
      return;
    }

    try {
      const found = await fetchProfile();
      if (!found.onboarded) {
        leave();
        return;
      }
      setUnreachable(false);
      setProfile(found);
      ready();
    } catch (error) {
      // 토큰이 죽은 것과 연결이 끊긴 것은 다르다. 끊긴 것으로 세션을 버리면
      // 지하철에서 앱을 연 사람이 애플 로그인부터 다시 해야 한다.
      if (isSessionGone(error)) {
        leave();
        return;
      }
      // 버전이 낡은 것은 연결 문제가 아니다. 다시 시도해 봐야 같은 답이 온다.
      if (needsUpdate(error)) {
        setOutdated(true);
        ready();
        return;
      }
      setUnreachable(true);
      // 그릴 것이 생겼으니 스플래시를 내린다. 알리지 않으면 6초를 기다린다.
      ready();
    }
  }, [leave]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (outdated) return <UpdateRequired onUpdate={openStore} />;
  if (profile === null) return unreachable ? <Unreachable onRetry={refresh} /> : null;

  return (
    <SessionContext.Provider
      value={{ profile, me: String(profile.id), refresh, signOut: leave }}
    >
      {children}
    </SessionContext.Provider>
  );
}
