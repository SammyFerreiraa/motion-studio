#!/usr/bin/env bash
# Instala as dependências da skill (idempotente). --voice adiciona faster-whisper (~500 MB de modelo no 1º uso).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "faltou ffmpeg"; exit 1; }
command -v node >/dev/null || { echo "faltou node"; exit 1; }
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -U numpy "yt-dlp[default]"
[ "${1:-}" = "--voice" ] && .venv/bin/pip install -q faster-whisper
[ -d node_modules/playwright ] || npm install --silent
# Chromium: reaproveita o cache do Playwright; só baixa se nada serve.
if ! ls ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome >/dev/null 2>&1; then npx playwright install chromium; fi
echo "ok: scripts/render.mjs, brand.mjs, audio.py, ref.sh prontos"
