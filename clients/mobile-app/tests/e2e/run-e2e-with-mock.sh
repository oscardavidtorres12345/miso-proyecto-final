#!/usr/bin/env bash
set -euo pipefail

node tests/e2e/mockServer.js &
MOCK_PID=$!

cleanup() {
  kill "$MOCK_PID" 2>/dev/null || true
}

trap cleanup EXIT

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
  exit 1
fi

export EXPO_PUBLIC_SEARCH_URL="http://10.0.2.2:3001/api/v1"
export EXPO_PUBLIC_BOOKING_URL="http://10.0.2.2:3001/api/v1"

set +e
timeout --signal=TERM --kill-after=30s 40m npm run test:e2e:android
EXIT=$?
set -e

if [ "$EXIT" -eq 124 ]; then
  echo "Detox timed out after 40 minutes"
fi

exit "$EXIT"
