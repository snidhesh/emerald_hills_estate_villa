#!/usr/bin/env bash
# Trim + re-encode the source walkthrough into a short, silent hero loop.
# Outputs MP4 (H.264) + WebM (VP9) + JPG/WebP poster. Tunable via SS/T.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/source/Images/Villa 181 - Final.mp4"
OUT="$ROOT/assets/video"; POSTER="$ROOT/assets/img/hero"
SS="${SS:-00:00:00}"; T="${T:-20}"; W="${W:-1600}"
[ -f "$SRC" ] || { echo "source video missing: $SRC" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: brew install ffmpeg" >&2; exit 1; }
mkdir -p "$OUT" "$POSTER"; cd "$ROOT"
echo "Trim: $SS +${T}s  width: $W"
echo ">> MP4 (H.264)"
ffmpeg -hide_banner -loglevel warning -y -ss "$SS" -i "$SRC" -t "$T" -an \
  -vf "scale=$W:-2,format=yuv420p" -c:v libx264 -preset slow -crf 24 \
  -profile:v high -level 4.1 -movflags +faststart -pix_fmt yuv420p "$OUT/hero.mp4"
echo ">> WebM (VP9) pass 1"
ffmpeg -hide_banner -loglevel warning -y -ss "$SS" -i "$SRC" -t "$T" -an -vf "scale=$W:-2" \
  -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -tile-columns 2 -pass 1 -passlogfile "$OUT/ff2pass" -f webm /dev/null
echo ">> WebM (VP9) pass 2"
ffmpeg -hide_banner -loglevel warning -y -ss "$SS" -i "$SRC" -t "$T" -an -vf "scale=$W:-2" \
  -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -tile-columns 2 -pass 2 -passlogfile "$OUT/ff2pass" "$OUT/hero.webm"
echo ">> Poster"
ffmpeg -hide_banner -loglevel warning -y -ss "$SS" -i "$SRC" -frames:v 1 -vf "scale=1920:-2" -q:v 3 "$POSTER/poster.jpg"
command -v cwebp >/dev/null && cwebp -quiet -q 80 -metadata none "$POSTER/poster.jpg" -o "$POSTER/poster.webp"
rm -f "$OUT"/ff2pass-*.log "$OUT"/ff2pass-*.log.mbtree
du -h "$OUT"/hero.mp4 "$OUT"/hero.webm "$POSTER"/poster.jpg "$POSTER"/poster.webp
