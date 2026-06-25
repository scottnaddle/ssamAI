#!/bin/bash
# daily-research.sh — 매일 자동으로 한국 교사 자료 수집
# 트리거: launchd (macOS) 또는 수동 실행
# 사용법: ./daily-research.sh [--initial|--runner|--status]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
RESEARCH_DIR="$PROJECT_ROOT/samples/research"
LOG_DIR="$RESEARCH_DIR/logs"
DATE_STAMP=$(date +%Y-%m-%d_%A)
LOG_FILE="$LOG_DIR/research_${DATE_STAMP}.log"

mkdir -p "$LOG_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "========== Daily research 트리거 =========="
log "날짜: $DATE_STAMP"

case "${1:-}" in
  --initial)
    log "모드: INITIAL (1주일치 일괄 수집 — 초기 1회만 사용)"
    python3 "$SCRIPT_DIR/daily-research-runner.py" 2>&1 | tee -a "$LOG_FILE"
    ;;
  --runner)
    log "모드: RUNNER (실제 리서치 즉시 실행)"
    python3 "$SCRIPT_DIR/daily-research-runner.py" 2>&1 | tee -a "$LOG_FILE"
    ;;
  --status)
    log "모드: STATUS"
    if launchctl list 2>/dev/null | grep -q "com.ssamai.edu-research.daily"; then
      log "✓ launchd 등록됨: 매일 오전 6시 자동 실행"
    else
      log "✗ launchd 미등록. 등록: ./install-launchd.sh install"
    fi
    log ""
    log "최근 트리거 이력:"
    ls -lt "$LOG_DIR" 2>/dev/null | head -5
    ;;
  *)
    log "기본 모드: TRIGGER (launchd/수동 트리거 → 실제 리서치 실행)"
    python3 "$SCRIPT_DIR/daily-research-runner.py" 2>&1 | tee -a "$LOG_FILE"
    ;;
esac

log "========== 트리거 종료 =========="