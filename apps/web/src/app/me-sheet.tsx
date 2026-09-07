/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { EVENT } from '@/lib/analytics';
import { renameMe } from '@/lib/api/me';
import { track } from '@/lib/track';
import { monthDayLabel } from '@/lib/entries';
import { cleanName } from '@/lib/profile';
import { useSession } from './session';
import Sheet from './sheet';

export default function MeSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { profile, refresh } = useSession();
  const [name, setName] = useState('');

  // 방 시트와 같은 이유로 열 때마다 다시 묻는다. 탭마다 웹뷰가 따로 살아서
  // 다른 탭에서 담거나 방을 맺어도 이 탭의 숫자는 그대로다.
  useEffect(() => {
    if (!open) return;
    setName(profile.name ?? '');
    void refresh();
    // 열리는 순간의 이름만 채운다. refresh 가 이름을 바꾸면 타이핑 중에 덮인다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 상대에게 보일 이름이라 빈 채로 두면 방에서 누가 누군지 알 수 없다.
  // 고친 것이 없으면 보내지 않는다. 시트를 열었다 닫기만 해도 요청이 나간다.
  const keep = () => {
    const next = cleanName(name);
    if (next === profile.name) return;
    track(EVENT.nameChanged, { had_name: profile.name !== null });
    void renameMe(next).then(refresh);
  };

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
          <dd>{profile.keptCount}가지</dd>
        </div>
        <div>
          <dt>처음 담은 날</dt>
          <dd>
            {profile.firstKeptDate ? monthDayLabel(profile.firstKeptDate) : '아직 없어요'}
          </dd>
        </div>
      </dl>

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
  margin: 0;

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
