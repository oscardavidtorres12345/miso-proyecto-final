#!/usr/bin/env bash
set -euo pipefail

node tests/e2e/mockServer.js &
MOCK_PID=$!

ready=0
for _ in $(seq 1 90); do
  if curl -fsS http://127.0.0.1:3001/api/v1/search/filters >/dev/null 2>&1; then
    echo "mock search service ready"
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "mock server did not become ready on port 3001 in time"
  kill "$MOCK_PID" 2>/dev/null || true
  exit 1
fi

npm run test:e2e:android
EXIT=$?
kill "$MOCK_PID" 2>/dev/null || true
exit "$EXIT"
