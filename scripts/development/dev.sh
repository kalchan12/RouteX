#!/usr/bin/env bash
# Start the API (SQLite fallback) and the web dev server for local development.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "1) API -> http://localhost:8000 (docs at /docs)"
(cd "$ROOT/apps/api" && uv run --project . uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &

echo "2) Web -> http://localhost:3000"
(cd "$ROOT/apps/web" && pnpm dev) &

trap 'kill 0' EXIT
wait
