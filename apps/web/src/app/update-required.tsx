/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';

/**
 * 서버가 이 버전을 더는 받지 않는다. 앱스토어는 웹뷰가 열 수 없으므로 누르면
 * 네이티브에 넘긴다. 다시 시도할 자리를 두지 않는 것은 눌러도 달라질 것이
 * 없기 때문이다.
 */
export default function UpdateRequired({ onUpdate }: { onUpdate: () => void }) {
  return (
    <main css={screenStyle}>
      <h1 css={headingStyle}>새 버전이 나왔어요</h1>
      <p css={bodyStyle}>
        담아둔 색은 그대로 있어요.
        <br />
        앱을 업데이트하면 이어서 담을 수 있어요.
      </p>
      <button type="button" onClick={onUpdate} css={updateStyle}>
        업데이트하기
      </button>
    </main>
  );
}

const screenStyle = css`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0 var(--space-edge);
  text-align: center;
  background: var(--color-background);
`;

/* 위계는 굵기가 아니라 크기로 준다. 갈무리에 볼드 페이스가 없어서
   font-weight 를 올리면 브라우저가 합성 볼드로 픽셀을 뭉갠다. */
const headingStyle = css`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--color-foreground);
`;

const bodyStyle = css`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-muted);
`;

/* 고를 것이 하나뿐인 화면이라 버튼도 하나다. 채운 버튼으로 두어
   여기를 누르면 된다는 것이 한눈에 보이게 한다. */
const updateStyle = css`
  padding: 0.875rem 2rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-foreground);
  color: var(--color-background);
  font: inherit;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out-expo), opacity var(--duration-fast) linear;

  @media (hover: hover) {
    &:hover {
      opacity: 0.85;
    }
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;
