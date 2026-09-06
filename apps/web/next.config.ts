import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  images: {
    /* 오브젝트 스토리지는 크기를 줄여 주지 않는다. 원본 그대로 내려오면 달력 한 칸
       (약 165px)에 640px 짜리가 들어간다. 줄이는 일은 next/image 가 맡는다.
       ** 는 호스트명 맨 앞에서만 여러 단계를 받는다. 가운데에 두면 아무것도 못 맞춘다. */
    remotePatterns: [{ protocol: 'https', hostname: '**.oraclecloud.com' }],
    /* 스토리지가 캐시 헤더를 안 보내서, 두지 않으면 줄인 사진을 매번 다시 만든다.
       사진은 다시 담으면 키가 바뀌어 새 파일이 되므로 오래 잡아도 낡지 않는다. */
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
