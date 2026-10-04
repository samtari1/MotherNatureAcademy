#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_LOG="$ROOT_DIR/.local-logs/api.log"
WEB_LOG="$ROOT_DIR/.local-logs/web.log"
API_PID=""
WEB_PID=""
TAIL_PID=""

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$(uname -s)" == "Darwin" ]] || fail "This local start script is for macOS."
[[ -x "$ROOT_DIR/backend/.venv/bin/uvicorn" ]] || fail "Backend environment is missing. Run ./setup.sh first."
[[ -f "$ROOT_DIR/backend/.env" ]] || fail "Backend configuration is missing. Run ./setup.sh first."
[[ -x "$ROOT_DIR/node_modules/.bin/next" ]] || fail "Node packages are missing. Run ./setup.sh first."
command -v curl >/dev/null 2>&1 || fail "curl is required to check that the API starts."
command -v lsof >/dev/null 2>&1 || fail "lsof is required to check local ports."

if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then fail "Port 3000 is already in use. Stop that process or change its port before starting this site."; fi
if lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then fail "Port 8000 is already in use. Stop that process or change its port before starting this API."; fi

mkdir -p "$ROOT_DIR/.local-logs"
: > "$API_LOG"
: > "$WEB_LOG"

cleanup() {
  trap - INT TERM EXIT
  [[ -n "$TAIL_PID" ]] && kill "$TAIL_PID" 2>/dev/null || true
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "$WEB_PID" ]] && kill "$WEB_PID" 2>/dev/null || true
  [[ -n "$TAIL_PID" ]] && wait "$TAIL_PID" 2>/dev/null || true
  [[ -n "$API_PID" ]] && wait "$API_PID" 2>/dev/null || true
  [[ -n "$WEB_PID" ]] && wait "$WEB_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$ROOT_DIR/backend" && exec "$ROOT_DIR/backend/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000) >> "$API_LOG" 2>&1 &
API_PID=$!

for _ in {1..30}; do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then break; fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    cat "$API_LOG" >&2
    fail "The API stopped during startup. Check PostgreSQL and backend/.env."
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8000/health >/dev/null || { cat "$API_LOG" >&2; fail "The API did not become healthy. Check PostgreSQL and backend/.env."; }

(cd "$ROOT_DIR" && exec node "$ROOT_DIR/node_modules/next/dist/bin/next" dev --hostname 127.0.0.1) >> "$WEB_LOG" 2>&1 &
WEB_PID=$!

printf 'Website: http://localhost:3000\nAPI health: http://localhost:8000/health\nAPI docs: http://localhost:8000/docs\n\nPress Ctrl+C here to stop both local services.\n\n'
tail -n 0 -F "$API_LOG" "$WEB_LOG" &
TAIL_PID=$!
wait "$TAIL_PID"
