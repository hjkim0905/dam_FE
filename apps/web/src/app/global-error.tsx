'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { strings } from '@/lib/i18n';

/**
 * 루트 레이아웃까지 깨졌을 때만 온다. 그 시점에는 emotion provider 도 globals.css 도
 * 없으므로, 이 화면은 아무것에도 기대지 않고 혼자 서야 한다. 그래서 css prop 대신
 * 인라인이고, 색도 변수가 아니라 값이다.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const s = strings();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={bodyStyle}>
        <main style={mainStyle}>
          <h1 style={headingStyle}>{s.somethingBroke}</h1>
          <p style={bodyTextStyle}>
            {s.colorsAreSafe}
            <br />
            {s.reopenApp}
          </p>
        </main>
      </body>
    </html>
  );
}

const bodyStyle = {
  margin: 0,
  background: '#ffffff',
  color: 'oklch(34% 0.015 60)',
  fontFamily: 'Galmuri14, system-ui, sans-serif',
} as const;

const mainStyle = {
  display: 'flex',
  minHeight: '100dvh',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  padding: '0 3.5rem',
  textAlign: 'center',
} as const;

/* 갈무리에 볼드 페이스가 없어서 위계는 굵기가 아니라 크기로 준다. */
const headingStyle = { margin: 0, fontSize: '1.75rem', fontWeight: 400 } as const;

const bodyTextStyle = {
  margin: 0,
  fontSize: '0.875rem',
  lineHeight: 1.6,
  color: 'oklch(56% 0.012 60)',
} as const;
