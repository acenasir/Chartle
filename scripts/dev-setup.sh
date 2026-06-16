#!/usr/bin/env bash
# Idempotent setup for fresh environments (e.g. Claude Code on the web, where
# the container is cloned fresh and node_modules is not committed).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "chartle: installing dependencies…"
  npm install --no-audit --no-fund >/dev/null 2>&1 && echo "chartle: deps ready."
else
  echo "chartle: deps already present."
fi

# The demo dataset is committed; regenerate only if it went missing.
if [ ! -f data/series.json ]; then
  echo "chartle: generating demo dataset…"
  node scripts/build-data.mjs
fi
