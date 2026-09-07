import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* 서버에 yarn install 을 하지 않으려고 쓴다. 필요한 node_modules 만 골라 담아
     주므로 올리는 것이 수십 MB 로 줄고, 서버에 빌드 도구를 두지 않아도 된다.
     .next/static 과 public 은 따로 복사해야 한다. 이것만 안 챙기면 화면이
     스타일 없이 뜨는데, 빌드는 초록이라 알아채기 어렵다. */
  output: 'standalone',
  /* 워크스페이스 루트가 위에 있어서, 안 잡아 주면 monorepo 밖까지 훑는다. */
  outputFileTracingRoot: path.join(__dirname, '../../'),
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

/* 소스맵을 올려야 스택이 읽힌다. 안 올리면 압축된 한 줄만 남아 아무것도 못 본다.
   토큰이 없는 곳(로컬, PR)에서는 업로드를 건너뛰고 빌드는 그대로 된다. */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  /* 올린 뒤 지운다. 남겨 두면 서버에서 누구나 원본 코드를 받아 갈 수 있다. */
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  /* 광고 차단기가 /monitoring 을 막지 않아서, 웹뷰에서도 보고가 끊기지 않는다. */
  tunnelRoute: '/monitoring',
  disableLogger: true,
});
