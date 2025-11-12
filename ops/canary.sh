#!/bin/bash

set -euo pipefail

ENDPOINT="${1:-}"
MAX_RETRIES=30
SLEEP_INTERVAL=10
SUCCESS_THRESHOLD=5

if [ -z "$ENDPOINT" ]; then
  echo "Error: No endpoint provided"
  echo "Usage: $0 <endpoint-url>"
  exit 1
fi

echo "Starting canary deployment validation for: $ENDPOINT"
echo "Testing criteria:"
echo "  - HTTP 200 response"
echo "  - Response time < 2s"
echo "  - $SUCCESS_THRESHOLD consecutive successful checks"

success_count=0
total_checks=0

for i in $(seq 1 $MAX_RETRIES); do
  total_checks=$((total_checks + 1))
  echo "Check $total_checks/$MAX_RETRIES..."

  start_time=$(date +%s%3N)

  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 5 \
    --connect-timeout 2 \
    "$ENDPOINT/api/health" || echo "000")

  end_time=$(date +%s%3N)
  response_time=$((end_time - start_time))

  if [ "$http_code" -eq 200 ] && [ "$response_time" -lt 2000 ]; then
    success_count=$((success_count + 1))
    echo "  ✓ Success (${response_time}ms) - ${success_count}/${SUCCESS_THRESHOLD}"

    if [ "$success_count" -ge "$SUCCESS_THRESHOLD" ]; then
      echo ""
      echo "Canary validation PASSED"
      echo "  Total checks: $total_checks"
      echo "  Successful: $success_count"
      echo "  Average response time: ${response_time}ms"
      exit 0
    fi
  else
    success_count=0
    echo "  ✗ Failed (HTTP: $http_code, Time: ${response_time}ms)"
  fi

  if [ "$i" -lt "$MAX_RETRIES" ]; then
    sleep $SLEEP_INTERVAL
  fi
done

echo ""
echo "Canary validation FAILED"
echo "  Total checks: $total_checks"
echo "  Successful streak needed: $SUCCESS_THRESHOLD"
echo "  Maximum achieved: $success_count"
exit 1
