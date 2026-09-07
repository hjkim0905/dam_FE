import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import AnalyticsProvider, { PageViews } from './analytics';
import EmotionProvider from './emotion-provider';
import SessionProvider from './session';
import TabReset from './tab-reset';
import './globals.css';

/* 설계 크기 14px 의 픽셀 폰트다. 화면의 글자 크기를 14 의 정수배로 두어야 또렷하다. */
const galmuri = localFont({
  src: './fonts/Galmuri14.woff2',
  variable: '--font-galmuri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '담. — 하루를 색으로 담다',
  description: '사진 한 장으로 오늘 하루를 색 하나로 기록하세요.',
  openGraph: {
    title: '담. — 하루를 색으로 담다',
    description: '사진 한 장으로 오늘 하루를 색 하나로 기록하세요.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  /* 키보드가 올라오면 화면 높이를 줄여 준다. 이게 없으면 100% 로 잡은 화면이
     키보드 뒤에 그대로 남아서, 메모나 초대코드를 치는 동안 입력칸이 가려진다. */
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={galmuri.variable}>
      <body>
        <TabReset />
        <AnalyticsProvider>
          <PageViews />
          <EmotionProvider>
            <div id="screen">
              <SessionProvider>{children}</SessionProvider>
            </div>
          </EmotionProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
