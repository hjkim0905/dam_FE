/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { requestHaptic } from '@/lib/bridge';
import Sheet from './sheet';

/** 되돌릴 수 없는 일은 한 번 더 묻는다. 무엇이 사라지는지 먼저 말하고 나서. */
export default function ConfirmSheet({
  open,
  title,
  detail,
  confirm,
  destructive,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  detail: string;
  confirm: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} label={title} fill={false} onClose={onClose}>
      <h2 css={titleStyle}>{title}</h2>
      <p css={detailStyle}>{detail}</p>

      <button
        type="button"
        onClick={() => {
          requestHaptic('medium');
          onConfirm();
        }}
        css={[actionStyle, destructive && destructiveStyle]}
      >
        {confirm}
      </button>
      <button type="button" onClick={onClose} css={[actionStyle, quietStyle]}>
        그만두기
      </button>
    </Sheet>
  );
}

const titleStyle = css`
  margin: 0.5rem 0 0.75rem;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const detailStyle = css`
  margin: 0 0 2rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-muted);
`;

const actionStyle = css`
  padding: 1.125rem;
  margin-bottom: 0.75rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-foreground);
  color: var(--color-background);
  font: inherit;
  font-size: 0.875rem;
  transition: transform var(--duration-fast) var(--ease-out-expo);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;

const destructiveStyle = css`
  background: var(--color-alert);
`;

const quietStyle = css`
  margin-bottom: 0;
  background: none;
  color: var(--color-muted);
`;
