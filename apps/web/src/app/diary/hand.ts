import localFont from 'next/font/local';

/* 다꾸 글씨는 손글씨체다. 앱 전체의 갈무리 규칙에서 이 탭만 뺐다. 2350자 한글 완성형을 다 담고 있다. */
const gaegu = localFont({ src: '../fonts/Gaegu-Regular.woff2', display: 'block' });

export const HAND = gaegu.style.fontFamily;

/** 캔버스는 폰트를 기다려 주지 않는다. 받아 둔 뒤에 그려야 시스템 폰트로 굳지 않는다. */
export const loadHand = (): Promise<string> =>
  document.fonts.load(`28px ${HAND}`, '담다꾸가나다').then(() => HAND, () => HAND);
