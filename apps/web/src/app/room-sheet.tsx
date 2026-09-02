/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useState } from 'react';
import { hasCompany } from '@/lib/entries';
import type { Entry } from '@/lib/entries';
import { isInviteCode, normalizeInviteCode } from '@/lib/profile';
import Sheet from './sheet';

export default function RoomSheet({
  open,
  entries,
  onClose,
}: {
  open: boolean;
  entries: readonly Entry[];
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const together = hasCompany(entries);

  return (
    <Sheet open={open} label="방" fill={false} onClose={onClose}>
      <h2 css={titleStyle}>방</h2>

      {together ? (
        <p css={stateStyle}>함께 담고 있어요.</p>
      ) : (
        <p css={stateStyle}>아직 혼자 담고 있어요.</p>
      )}

      <label css={fieldStyle}>
        <span css={labelStyle}>받은 초대코드</span>
        <input
          value={code}
          onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
          placeholder="여섯 자리"
          inputMode="text"
          autoCapitalize="characters"
          maxLength={6}
          css={inputStyle}
        />
      </label>

      {/* 코드를 주고받는 일도, 방을 맺는 일도 서버가 있어야 성립한다.
          형태가 맞는지까지는 여기서 보고, 그 뒤는 계정이 붙을 때 잇는다. */}
      <button type="button" disabled={!isInviteCode(code)} css={actionStyle}>
        {isInviteCode(code) ? '이 코드로 들어가기' : '여섯 자리를 채워 주세요'}
      </button>

      <p css={noteStyle}>초대와 방 맺기는 계정이 생긴 뒤에 열려요.</p>
    </Sheet>
  );
}

const titleStyle = css`
  margin: 0.5rem 0 1.25rem;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const stateStyle = css`
  margin: 0 0 2rem;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const fieldStyle = css`
  display: block;
  margin-bottom: 1.5rem;
`;

const labelStyle = css`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const inputStyle = css`
  width: 100%;
  padding: 0.75rem 0;
  border: none;
  border-bottom: 0.0625rem solid var(--color-faint);
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: 0.3em;
  outline: none;
  transition: border-color var(--duration-fast) linear;

  &::placeholder {
    letter-spacing: normal;
    color: var(--color-muted);
  }

  &:focus {
    border-bottom-color: var(--color-foreground);
  }
`;

const actionStyle = css`
  width: 100%;
  padding: 1.125rem;
  margin-bottom: 1.5rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-foreground);
  color: var(--color-background);
  font: inherit;
  font-size: 0.875rem;
  transition: transform var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) linear;

  &:disabled {
    background: var(--color-faint);
    color: var(--color-muted);
  }

  &:not(:disabled):active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;

const noteStyle = css`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
`;
