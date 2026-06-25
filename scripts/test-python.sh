#!/bin/bash
# Run pytest across all 3 Python services.
# Each service has its own test directory with sys.path setup; running from
# within the service directory ensures 'app.*' imports resolve correctly.
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

SERVICES=("persona-service" "ppt-service" "skill-service")
TOTAL_PASS=0
TOTAL_FAIL=0

for svc in "${SERVICES[@]}"; do
  echo "=== $svc ==="
  if (cd "services/$svc" && python3 -m pytest tests/ --tb=short -q 2>&1); then
    :
  else
    echo "❌ $svc tests failed"
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
  fi
done

if [ $TOTAL_FAIL -gt 0 ]; then
  echo ""
  echo "❌ $TOTAL_FAIL service(s) had test failures"
  exit 1
fi

echo ""
echo "✅ All Python service tests passed"
