#!/usr/bin/env bash
# L2: 작업을 끝내려 할 때 도는 전체 통합 검증. 실패하면 exit 2 로 종료를 차단한다.
# L1과 달리 여기서는 막는다. 작업 중 깨진 상태는 정상이지만, 끝낼 때는 초록이어야 한다.
set -uo pipefail

input=$(cat)

cd "$(dirname "$0")/../.." || exit 0
# 같은 코드를 두 번 막지는 않는다. stop_hook_active는 "한 번 막혔다"는 뜻이지
# "이 코드를 검사했다"는 뜻이 아니라서, 막힌 뒤 고친 코드까지 그냥 보내 줬다.
fingerprint=$( { git diff HEAD; git ls-files --others --exclude-standard -z | xargs -0 shasum; } | shasum | cut -d' ' -f1 )
last="$(git rev-parse --git-dir)/dam-last-verified"
[ "$(cat "$last" 2>/dev/null)" = "$fingerprint" ] && exit 0
printf '%s' "$fingerprint" > "$last"

failures=""

run() {
  local label="$1"
  shift
  local out
  if ! out=$("$@" 2>&1); then
    failures="${failures}[${label}]"$'\n'"$(printf '%s' "$out" | tail -n 25)"$'\n\n'
  fi
}

run "web typecheck" yarn --cwd apps/web typecheck
run "native typecheck" yarn --cwd apps/native typecheck
run "web test" yarn --cwd apps/web test
run "native test" yarn --cwd apps/native test
run "web lint" yarn --cwd apps/web lint

# 화면이 늘어나면 여기에 a11y·대비율 자동 검사를 추가한다 (axe 등).
# 지금은 검사할 화면이 하나뿐이라 도구 도입 비용이 이득보다 크다.

[ -z "$failures" ] && exit 0

printf '검증이 통과하지 않아 작업을 끝낼 수 없다. 아래를 고치고 계속하라.\n\n%s' "$failures" >&2
exit 2
