# dam_FE

담. — 하루를 색으로 담다. 프론트엔드 모노레포 (React Native + Next.js).

## 구조

```
apps/
├── native/   Expo RN 쉘 (iOS). WebView로 웹을 띄우고 네이티브 기능만 담당한다.
└── web/      Next.js (App Router) + Emotion. 실제 화면은 전부 여기서 만든다.
```

백엔드(Spring Boot)는 별도 레포. 프론트와 배포 파이프라인이 달라 분리했다.

## 시작하기

```bash
yarn install

# 웹 (http://localhost:3000)
yarn web

# 네이티브 (웹이 먼저 떠 있어야 한다)
yarn native
yarn ios      # 시뮬레이터
```

지금은 iOS만 지원한다.

`.env`는 각 앱의 `.env.example`을 복사해서 만든다.

- `apps/native/.env` — `WEB_URL` (WebView가 띄울 주소)
- `apps/web/.env` — `NEXT_PUBLIC_API_URL` (백엔드 주소)

## 웹 ↔ 네이티브 브리지

`{ type, payload }` JSON 한 가지 형태만 쓴다.

```ts
// 웹에서 (apps/web/src/lib/bridge.ts)
sendToNative({ type: 'PING' });
const unsubscribe = subscribeToNative((message) => console.log(message.type));
```

네이티브 쪽 처리는 `apps/native/utils/bridge.ts`의 `handleBridgeMessage`에
`case`를 추가한다. 카메라·권한·푸시처럼 웹이 못 하는 것만 여기로 보낸다.

## 배포

- 웹: Vercel
- 앱: EAS Build (설정 추가 필요)
