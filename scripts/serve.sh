#!/usr/bin/env bash
# Local dev server. Visit http://localhost:8080/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-8080}"
echo "Serving $ROOT at http://localhost:$PORT/"
exec python3 -m http.server "$PORT"
