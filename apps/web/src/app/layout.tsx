import type { Metadata, Viewport } from 'next';
import EmotionProvider from './emotion-provider';
import './globals.css';

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <EmotionProvider>{children}</EmotionProvider>
      </body>
    </html>
  );
}
