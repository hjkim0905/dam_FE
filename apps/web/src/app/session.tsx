/** @jsxImportSource @emotion/react */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchProfile } from '@/lib/api/me';
import type { ProfileResponse } from '@/lib/api/types';
import { ready, signedOut } from '@/lib/bridge';
import { clearSession, loadToken } from '@/lib/session';

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
      setProfile(found);
      ready();
    } catch {
      leave();
    }
  }, [leave]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (profile === null) return null;

  return (
    <SessionContext.Provider
      value={{ profile, me: String(profile.id), refresh, signOut: leave }}
    >
      {children}
    </SessionContext.Provider>
  );
}
