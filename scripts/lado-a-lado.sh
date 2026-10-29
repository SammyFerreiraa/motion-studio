#!/usr/bin/env bash
# Folha de crítica "estrutura = referência?": referência e filme lado a lado, 1 quadro por segundo (ou a cada PASSO s).
#   lado-a-lado.sh <ref.mp4> <filme.mp4> <saida.jpg> [passo_s=1] [colunas=4]
# Cada célula: ref à esquerda, filme à direita, com o tempo em cima. Use em toda rodada de crítica.
set -euo pipefail
REF="${1:?ref.mp4}"; FILM="${2:?filme.mp4}"; OUT="${3:?saida.jpg}"; P="${4:-1}"; C="${5:-4}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FILM"); n=$(awk "BEGIN{print int($dur/$P)}"); rows=$(( (n + C - 1) / C ))
cell="fps=1/$P,scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2:color=white"
ffmpeg -loglevel error -y -t "$dur" -i "$REF" -i "$FILM" -filter_complex \
 "[0:v]$cell[a];[1:v]$cell[b];[a][b]hstack,pad=iw+12:ih+28:6:22:color=0x888888,drawtext=text='t=%{eif\:n*$P+$P/2\:d} s  ref | filme':x=8:y=4:fontsize=16:fontcolor=white,tile=${C}x${rows}" \
 -frames:v 1 -q:v 3 "$OUT"
echo "ok → $OUT ($n pares, ${C} por linha)"
