#!/usr/bin/env bash
# 서버 안에서 도는 부분. 새 빌드를 바꿔 끼우고, 뜨지 않으면 되돌린다.
# CD 가 부르지만 손으로도 돌릴 수 있다:  bash release-web.sh
set -euo pipefail

NEW=/tmp/dam-web.tar.gz
LIVE=/srv/dam-web
PREV=/srv/dam-web.prev
HEALTH=http://127.0.0.1:3000/

[ -f "$NEW" ] || { echo "올라온 빌드가 없다: $NEW"; exit 1; }

sudo rm -rf "$PREV"
[ -d "$LIVE" ] && sudo cp -a "$LIVE" "$PREV"

# 통째로 지우고 푼다. 지운 파일이 남아 있으면 옛 청크가 계속 서빙된다.
sudo rm -rf "$LIVE"
sudo mkdir -p "$LIVE"
sudo tar -xzf "$NEW" -C "$LIVE"
sudo chown -R damweb:damweb "$LIVE"
sudo rm -f "$NEW"

sudo systemctl restart dam-web

for _ in $(seq 1 30); do
  sleep 2
  if curl -sf -o /dev/null "$HEALTH"; then
    echo "떴다"
    sudo rm -rf "$PREV"
    exit 0
  fi
done

echo "60초 안에 뜨지 않았다. 되돌린다."
sudo journalctl -u dam-web -n 40 --no-pager
if [ -d "$PREV" ]; then
  sudo rm -rf "$LIVE"
  sudo mv "$PREV" "$LIVE"
  sudo systemctl restart dam-web
  echo "이전 빌드로 돌아갔다"
else
  echo "돌아갈 빌드가 없다. 첫 배포였던 듯하다"
fi
exit 1
