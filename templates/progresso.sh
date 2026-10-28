#!/usr/bin/env bash
# Barra de progresso do render 4K: lê render4k.log e atualiza a cada 2 s. Ctrl+C só fecha a barra, o render continua.
cd "$(dirname "$0")"
OUT=${OUT:-video-16x9.mp4}; F=${FRAMES:-1620}  # ex.: OUT=01-nome-16x9.mp4 FRAMES=1440 bash progresso.sh (quadros = duração × 60)
start=$(date +%s)
while true; do
  n=$(tail -c 200 render4k.log | grep -o "[0-9]*/$F" | tail -1 | cut -d/ -f1); n=${n:-0}
  pct=$((n * 100 / $F)); el=$(( $(date +%s) - start ))
  [ "$n" -gt 0 ] && eta=$(( el * ($F - n) / n )) || eta=0
  fill=$((pct * 40 / 100)); bar=$(printf '#%.0s' $(seq 1 $fill) 2>/dev/null)
  printf '\r[%-40s] %3d%%  %d/%d quadros  ETA ~%dmin   ' "$bar" "$pct" "$n" "$F" $((eta / 60))
  [ -s resultados/$OUT ] && ! pgrep -f "render.mjs film.html" >/dev/null && { echo; echo "pronto: resultados/$OUT"; break; }
  sleep 2
done
