#!/usr/bin/env bash
# 성능 작업은 재는 것부터다. 재지 않고 고치면 무엇이 나아졌는지 아무도 모르고,
# 나빠져도 모른다. 그 순서를 사람이 기억하는 대신 여기서 붙잡는다.
set -euo pipefail

prompt=$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("prompt",""))' 2>/dev/null || true)

echo "$prompt" | grep -qiE '성능|최적화|느리|빠르게|렉|버벅|perf|optimi[sz]|slow|faster|lcp|fps|번들|bundle' || exit 0

cat <<'GUIDE'
[성능 작업 규칙]

고치기 전에 아래를 순서대로 한다. 건너뛰지 말고, 사람의 허락 없이 구현으로 넘어가지 않는다.

1. 문제를 숫자로 정의한다. "빠르게"는 문제 정의가 아니다.
   - 조건과 목표를 함께 적는다.
     예) 프랑스 파리에서 Fast 3G 로 접속했을 때 Home 첫 로드 LCP < 2.5s,
         두 번째 이후 < 1.5s
     예) 검색 결과에서 더 불러오기를 눌렀을 때, 새로 추가된 항목만 다시 그려야 한다

2. 어떻게 잴지 정하고 사람에게 알려준다.
   - 네트워크·로딩: WebPageTest (https://www.webpagetest.org/) 에서 지역을 지정해 측정
   - 렌더·프레임: Chrome DevTools > Performance 로 프로파일링, Frame 섹션 확인
   - 번들 크기: 빌드 산출물 크기를 직접 비교

3. 고치기 전 상태를 측정하고 스크린샷으로 남긴다.

4. 여기서 멈추고 사람에게 확인받는다.
   측정값과 목표를 보여주고 "이대로 진행할까요?" 를 묻는다.
   허락 전에는 코드를 고치지 않는다.

5. 허락받은 뒤에 고친다.

6. 같은 방법으로 다시 재고 스크린샷을 남긴다. 전후를 나란히 보여준다.
   목표에 못 미치면 그 사실을 그대로 말한다.
GUIDE
