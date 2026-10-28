#!/usr/bin/env bash
# Vistas de crítica do vídeo renderizado (Lukas Margerie / Movez): o que a folha por batida não mostra.
#   checks.sh <video.mp4> <pasta_saida> [t_acao_rapida=dur/3] [film.html]
# Gera: strip.png (12 quadros seguidos em volta de uma ação rápida: pega pops e fantasmas de blur),
#       phone.png (1 quadro/s a 360 px de largura: como lê no celular), loop_check.mp4 (o vídeo duas vezes: veja a emenda),
#       poster.png (POSTER_T=s, padrão metade do vídeo). Com film.html: determinismo (mesmo t renderizado 2× = mesmo hash).
set -euo pipefail
export LC_ALL=C   # awk em pt_BR imprime "4,1" e o ffmpeg recusa
V="${1:?video.mp4}"; OUT="${2:?pasta}"; FILM="${4:-}"
mkdir -p "$OUT"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
T="${3:-$(awk "BEGIN{print $dur/3}")}"
ffmpeg -loglevel error -y -ss "$(awk "BEGIN{t=$T-0.1; print (t<0?0:t)}")" -i "$V" -vf "scale=320:-1,tile=12x1" -frames:v 1 "$OUT/strip.png"
n=$(awk "BEGIN{print int($dur)+1}"); rows=$(( (n + 5) / 6 ))
ffmpeg -loglevel error -y -i "$V" -vf "fps=1,scale=360:-1,tile=6x$rows" -frames:v 1 "$OUT/phone.png"
ffmpeg -loglevel error -y -stream_loop 1 -i "$V" -vf scale=-2:540 -c:v libx264 -crf 23 -preset veryfast -c:a aac "$OUT/loop_check.mp4"   # 540p: em 4K a cópia passa de 1 GB
ffmpeg -loglevel error -y -ss "${POSTER_T:-$(awk "BEGIN{print $dur/2}")}" -i "$V" -frames:v 1 "$OUT/poster.png"
echo "ok → $OUT: strip.png (t≈$T s) · phone.png · loop_check.mp4 · poster.png"
if [ -n "$FILM" ]; then
  R="$(dirname "$0")/render.mjs"; tmp=$(mktemp -d)
  for k in a b; do node "$R" "$FILM" --sheet "$tmp/$k.png" --times "$T" --res 540 >/dev/null; done
  if cmp -s "$tmp/a-1.png" "$tmp/b-1.png"; then echo "determinismo ok (t=$T)"; else echo "DETERMINISMO FALHOU: t=$T muda entre renders (Math.random/Date/estado?)"; exit 3; fi
  rm -rf "$tmp"
fi
