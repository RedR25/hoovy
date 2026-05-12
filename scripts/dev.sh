#!/usr/bin/env bash
# Dev launcher (POSIX). Runs FastAPI with --reload and Vite with HMR
# concurrently in the same shell; Ctrl-C stops both.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  trap - INT TERM EXIT
  [[ -n "${be_pid:-}" ]] && kill "$be_pid" 2>/dev/null || true
  [[ -n "${fe_pid:-}" ]] && kill "$fe_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$root/backend" && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
be_pid=$!

(cd "$root/frontend" && npm run dev) &
fe_pid=$!

echo "backend: http://localhost:8000  frontend: http://localhost:5173"
wait
