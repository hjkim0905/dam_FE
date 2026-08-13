#!/usr/bin/env bash
# L1: 파일 단위 즉시 검증. 차단하지 않고 발견한 문제를 컨텍스트로 되돌려준다.
# 작업 중 일시적으로 깨진 상태는 정상이므로 여기서 막으면 진행이 불가능해진다.
set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)

[ -n "$file" ] && [ -f "$file" ] || exit 0

case "$file" in
  */node_modules/*|*/.next/*|*/ios/*|*/.expo/*) exit 0 ;;
esac

findings=""
add() { findings="${findings}$1"$'\n'; }

case "$file" in
  *.tsx)
    uses_css_prop=$(grep -q 'css={' "$file" && echo yes || echo no)
    uses_emotion=$(grep -qE "css=\{|from '@emotion/|from \"@emotion/" "$file" && echo yes || echo no)
    has_pragma=$(head -n 1 "$file" | grep -q '@jsxImportSource @emotion/react' && echo yes || echo no)
    has_use_client=$(head -n 5 "$file" | grep -q "'use client'" && echo yes || echo no)

    if [ "$uses_css_prop" = yes ] && [ "$has_pragma" = no ]; then
      add "- 1번째 줄이 '/** @jsxImportSource @emotion/react */' 가 아니다. pragma는 파일 맨 앞에서만 인식되므로, 없으면 css prop이 무시되어 스타일이 적용되지 않는다."
    fi

    if [ "$uses_emotion" = yes ] && [ "$has_use_client" = no ]; then
      add "- 상위 5줄에 \"'use client'\" 가 없다. Emotion은 React Context를 쓰므로 서버 컴포넌트에서 'createContext is not a function' 으로 빌드가 깨진다."
    fi

    if [ "$uses_emotion" = no ] && [ "$has_pragma" = yes ]; then
      add "- Emotion을 쓰지 않는데 jsxImportSource pragma가 있다. 이 파일의 JSX 전체가 불필요하게 Emotion 런타임을 타게 되고, 서버 컴포넌트라면 빌드가 깨진다. pragma를 지워라."
    fi

    if grep -nE '^[[:space:]]*[a-z-]+:[^;]*[^a-zA-Z0-9-][0-9]+(\.[0-9]+)?px' "$file" >/dev/null; then
      offenders=$(grep -nE '^[[:space:]]*[a-z-]+:[^;]*[^a-zA-Z0-9-][0-9]+(\.[0-9]+)?px' "$file" | head -n 5 | sed 's/^/    /')
      add "- px 고정값이 있다. rem/em/vw/dvh 등 상대 단위로 바꿔라:"$'\n'"$offenders"
    fi

    if [ "$uses_css_prop" = yes ]; then
      add "- UI를 수정했다. ui-ux-pro-max 기준으로 자가 점검하라: 계층(scale contrast), 간격 리듬, hover/focus/active 상태, globals.css 토큰(var(--...)) 사용 여부."
    fi
    ;;
esac

case "$file" in
  */tsconfig.json)
    grep -q 'jsxImportSource' "$file" \
      && add "- tsconfig에 jsxImportSource가 있다. 전역 설정하면 서버 컴포넌트까지 Emotion을 거쳐 'createContext is not a function' 으로 빌드가 실패한다. 파일별 pragma로만 제한하라."
    ;;
esac

[ -z "$findings" ] && exit 0

printf '%s 에서 프로젝트 규칙 위반:\n%s' "$file" "$findings" \
  | python3 -c '
import json, sys
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": sys.stdin.read(),
}}))'
exit 0
