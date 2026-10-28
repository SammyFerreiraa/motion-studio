#!/usr/bin/env bash
# Quadros densos da referência para estudar efeitos e transições: 5 quadros/s em folhas 4x4 (480 px).
#   ref-dense.sh <ref.mp4> <pasta_saida> [fps=5]
set -euo pipefail
SRC="${1:?ref.mp4}"; OUT="${2:?pasta}"; FPS="${3:-5}"
mkdir -p "$OUT"
ffmpeg -loglevel error -y -i "$SRC" -vf "fps=$FPS,scale=480:-1,tile=4x4" -q:v 3 "$OUT/d%02d.jpg"
echo "ok → $(ls "$OUT" | wc -l) folhas em $OUT (16 quadros cada, ${FPS}/s, em ordem esquerda→direita, cima→baixo)"
