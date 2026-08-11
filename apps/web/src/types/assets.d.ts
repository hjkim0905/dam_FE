// yarn workspaces가 next를 루트로 호이스팅해서 IDE의 TS 서버가 next-env.d.ts의
// types="next" 를 못 따라가는 경우가 있다. CSS 부수 효과 import 타입을 직접 선언한다.
declare module '*.css';
