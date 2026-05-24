#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Frontend build"
cd "$ROOT_DIR"
npm run build

echo ""
echo "==> Backend check"
cd "$ROOT_DIR/backend"
npm run check

echo ""
echo "==> Git status"
cd "$ROOT_DIR"
git status --short

echo ""
echo "✅ Final MVP check completed"
