/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { isApiError } from '@/lib/api/errors';
import { issueInvite, joinRoom, leaveRoom } from '@/lib/api/rooms';
import { requestHaptic } from '@/lib/bridge';
import { isInviteCode, normalizeInviteCode } from '@/lib/profile';
import { useSession } from './session';
import Sheet from './sheet';

export default function RoomSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { profile, refresh } = useSession();
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const room = profile.room;
  const together = room !== null && room.partner !== null;

  // 다시 열 때 지난 결과가 남아 있으면 방금 일어난 일처럼 읽힌다.
  //
  // 열 때마다 방 상태를 다시 묻는 이유: 탭마다 웹뷰가 따로 살아서, 다른 탭에서
  // 방을 맺어도 이 탭은 모른다. 열었을 때가 사용자가 답을 기대하는 순간이다.
  useEffect(() => {
    if (!open) return;
    setCode('');
    setInvite(null);
    setCopied(false);
    setFailed(null);
    void refresh();
  }, [open, refresh]);

  const run = (work: Promise<unknown>) => {
    setWorking(true);
    setFailed(null);
    return work
      .catch((error: unknown) => {
        setFailed(isApiError(error) ? error.message : '잠시 뒤에 다시 시도해 주세요');
        throw error;
      })
      .finally(() => setWorking(false));
  };

  const make = () => {
    void run(issueInvite().then(({ code: issued }) => setInvite(issued))).catch(() => {});
  };

  /** 링크가 아니라 코드다. 어떤 메신저로 보내든 글자는 살아남는다. */
  const copy = () => {
    if (invite === null) return;
    void navigator.clipboard
      .writeText(invite)
      .then(() => {
        setCopied(true);
        requestHaptic('light');
      })
      .catch(() => setFailed('복사하지 못했어요. 코드를 직접 옮겨 적어 주세요'));
  };

  const join = () => {
    void run(joinRoom(code).then(refresh)).catch(() => {});
  };

  const leave = () => {
    void run(leaveRoom().then(refresh)).catch(() => {});
  };

  return (
    <Sheet open={open} label="방" fill={false} onClose={onClose}>
      <h2 css={titleStyle}>방</h2>

      <p css={stateStyle}>
        {together
          ? `${room.partner!.name}님과 함께 담고 있어요.`
          : '아직 혼자 담고 있어요.'}
      </p>

      {together ? (
        <button
          type="button"
          onClick={leave}
          disabled={working}
          css={[actionStyle, quietStyle]}
        >
          방 나가기
        </button>
      ) : invite !== null ? (
        <>
          <p css={codeLabelStyle}>이 코드를 상대에게 보내 주세요</p>
          <output css={codeStyle}>{invite}</output>
          <button type="button" onClick={copy} css={actionStyle}>
            {copied ? '복사했어요' : '코드 복사하기'}
          </button>
          <p css={noteStyle}>하루가 지나면 코드가 만료돼요.</p>
        </>
      ) : (
        <>
          <button type="button" onClick={make} disabled={working} css={actionStyle}>
            초대코드 만들기
          </button>

          <p css={orStyle}>또는</p>

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

          <button
            type="button"
            onClick={join}
            disabled={!isInviteCode(code) || working}
            css={actionStyle}
          >
            {isInviteCode(code) ? '이 코드로 들어가기' : '여섯 자리를 채워 주세요'}
          </button>
        </>
      )}

      {failed !== null && (
        <p css={failStyle} role="alert">
          {failed}
        </p>
      )}
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

const codeLabelStyle = css`
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

/* 여섯 자를 불러 주거나 옮겨 적는 일이 있어서 글자를 크게 벌린다. */
const codeStyle = css`
  display: block;
  margin-bottom: 1.5rem;
  padding: 1.25rem 0;
  border-radius: var(--radius-card);
  background: oklch(from var(--color-faint) l c h / 0.5);
  text-align: center;
  font-size: 1.75rem;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
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
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) linear;

  &:disabled {
    background: var(--color-faint);
    color: var(--color-muted);
    cursor: default;
  }

  @media (hover: hover) {
    &:not(:disabled):hover {
      opacity: 0.85;
    }
  }

  &:not(:disabled):active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--color-foreground);
    outline-offset: 0.25rem;
  }
`;

const orStyle = css`
  margin: 0 0 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const quietStyle = css`
  background: none;
  border: 0.0625rem solid var(--color-faint);
  color: var(--color-muted);
`;

const noteStyle = css`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
`;

const failStyle = css`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-alert);
`;
