/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { entriesFrom, monthDayLabel } from '@/lib/entries';
import type { Entry } from '@/lib/entries';
import { cleanName } from '@/lib/profile';
import { loadProfile, saveProfile } from '@/lib/profile-store';
import Sheet from './sheet';

export default function MeSheet({
  open,
  entries,
  onClose,
}: {
  open: boolean;
  entries: readonly Entry[];
  onClose: () => void;
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(loadProfile()?.name ?? '');
  }, [open]);

  const mine = entriesFrom(entries, 'mine');
  const first = [...mine].sort((a, b) => a.date.localeCompare(b.date))[0];

  // 상대에게 보일 이름이라 빈 채로 두면 방에서 누가 누군지 알 수 없다.
  const keep = () => saveProfile({ name: cleanName(name) });

  return (
    <Sheet open={open} label="내 정보" fill={false} onClose={onClose}>
      <h2 css={titleStyle}>내 정보</h2>

      <label css={fieldStyle}>
        <span css={labelStyle}>이름</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={keep}
          placeholder="상대에게 보일 이름"
          maxLength={12}
          css={inputStyle}
        />
      </label>

      <dl css={statsStyle}>
        <div>
          <dt>담은 색</dt>
          <dd>{mine.length}가지</dd>
        </div>
        <div>
          <dt>처음 담은 날</dt>
          <dd>{first ? monthDayLabel(first.date) : '아직 없어요'}</dd>
        </div>
      </dl>

      <p css={noteStyle}>계정은 아직 이 기기에만 있어요.</p>
    </Sheet>
  );
}

const titleStyle = css`
  margin: 0.5rem 0 1.75rem;
  font-size: 1.75rem;
  font-weight: 400;
  letter-spacing: -0.02em;
`;

const fieldStyle = css`
  display: block;
  margin-bottom: 2rem;
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
  outline: none;
  transition: border-color var(--duration-fast) linear;

  &::placeholder {
    color: var(--color-muted);
  }

  &:focus {
    border-bottom-color: var(--color-foreground);
  }
`;

const statsStyle = css`
  margin: 0 0 2rem;

  div {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 0.0625rem solid var(--color-faint);
  }

  dt {
    font-size: 0.875rem;
    color: var(--color-muted);
  }

  dd {
    margin: 0;
    font-size: 0.875rem;
  }
`;

const noteStyle = css`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
`;
