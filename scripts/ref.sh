#!/usr/bin/env bash
# Baixa um vídeo de referência e gera quadros + folhas de contato (3x3) pra estudar o ESTILO.
#   ref.sh <url|arquivo.mp4> <pasta> [intervalo_s=0.5] [trecho INI-FIM em s, ex.: 0-20]
# Só para análise de gramática (ritmo, transição, tipografia). Nunca reaproveitar o conteúdo.
# Se o YouTube der 429/bloqueio: YTDLP_ARGS="--cookies-from-browser firefox" ref.sh ...
set -euo pipefail
SRC="${1:?url ou arquivo}"; OUT="${2:?pasta}"; EVERY="${3:-0.5}"; TRECHO="${4:-}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
YT="$HERE/.venv/bin/yt-dlp"; [ -x "$YT" ] || YT=yt-dlp   # o yt-dlp do sistema costuma estar velho
mkdir -p "$OUT/frames" "$OUT/sheets"
if [ -f "$SRC" ]; then cp "$SRC" "$OUT/ref.mp4"; else
  # shellcheck disable=SC2086
  "$YT" ${YTDLP_ARGS:-} -f "bv*[height<=720]+ba/b[height<=720]" --merge-output-format mp4 -o "$OUT/ref.mp4" "$SRC"
fi
if [ -n "$TRECHO" ]; then   # usa só um trecho da referência (o resto nem vira quadro)
  ffmpeg -loglevel error -y -ss "${TRECHO%-*}" -to "${TRECHO#*-}" -i "$OUT/ref.mp4" -c:v libx264 -crf 16 -preset fast -c:a aac "$OUT/ref-trecho.mp4" && mv "$OUT/ref-trecho.mp4" "$OUT/ref.mp4"
fi
ffmpeg -loglevel error -y -i "$OUT/ref.mp4" -vf "fps=1/$EVERY,scale=640:-1" -q:v 4 "$OUT/frames/%04d.jpg"
ffmpeg -loglevel error -y -framerate 1 -i "$OUT/frames/%04d.jpg" -vf "tile=3x3" -q:v 3 "$OUT/sheets/s%02d.jpg"
N=$(ls "$OUT/frames" | wc -l); S=$(ls "$OUT/sheets" | wc -l)
echo "ok → $N quadros (1 a cada ${EVERY}s), $S folhas em $OUT/sheets/ (cada folha = 9 quadros em ordem)"
