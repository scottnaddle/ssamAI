#!/bin/bash
# install-launchd.sh — daily research 자동 등록/해제
# 사용법: ./install-launchd.sh [install|uninstall|status]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_FILE="$SCRIPT_DIR/com.ssamai.edu-research.daily.plist"
LABEL="com.ssamai.edu-research.daily"
PLIST_DEST="$HOME/Library/LaunchAgents/$LABEL.plist"

case "${1:-status}" in
  install)
    mkdir -p "$HOME/Library/LaunchAgents"
    cp "$PLIST_FILE" "$PLIST_DEST"
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    launchctl load "$PLIST_DEST"
    echo "✓ 설치 완료: 매일 오전 6시 자동 실행"
    echo "  위치: $PLIST_DEST"
    echo ""
    echo "수동 테스트: launchctl start $LABEL"
    ;;
  uninstall)
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm -f "$PLIST_DEST"
    echo "✓ 제거 완료"
    ;;
  status)
    if launchctl list | grep -q "$LABEL"; then
      echo "✓ 등록됨: $LABEL"
      launchctl list | grep "$LABEL"
    else
      echo "✗ 미등록. 등록하려면: ./install-launchd.sh install"
    fi
    ;;
  *)
    echo "사용법: $0 [install|uninstall|status]"
    exit 1
    ;;
esac