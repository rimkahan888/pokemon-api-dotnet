#!/usr/bin/env bash
# Regenerate docs/frontend-handoff/openapi.json from the running Development API.
# OpenAPI is mapped only when ASPNETCORE_ENVIRONMENT=Development.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/docs/frontend-handoff/openapi.json"
PORT="${PORT:-5010}"
BASE="http://127.0.0.1:${PORT}"

export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS="$BASE"
export DOTNET_CLI_TELEMETRY_OPTOUT=1

dotnet run --project "$ROOT/PokemonApi" --no-launch-profile &
PID=$!
cleanup() {
  kill "$PID" >/dev/null 2>&1 || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE/openapi/v1.json" -o "$OUT"; then
    python3 -m json.tool "$OUT" > "$OUT.tmp"
    mv "$OUT.tmp" "$OUT"
    echo "Wrote $OUT"
    exit 0
  fi
  sleep 0.5
done

echo "Timed out waiting for $BASE/openapi/v1.json" >&2
exit 1
