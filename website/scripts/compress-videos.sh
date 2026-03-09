#!/usr/bin/env bash
# compress-videos.sh — Compress MP4 videos using ffmpeg
# Usage: ./compress-videos.sh <publicDir>
# Outputs: count|savedKB

PUBLIC_DIR="$1"
if [ -z "$PUBLIC_DIR" ]; then echo "0|0"; exit 0; fi

if ! command -v ffmpeg &>/dev/null; then
  echo "skip|0|0"
  exit 0
fi

total_saved=0
count=0

for vid in $(find "$PUBLIC_DIR" -name "*.mp4" -not -path "*/investors/*" 2>/dev/null); do
  [ -z "$vid" ] && continue
  size_before=$(wc -c < "$vid" | tr -d ' ')
  tmp_vid="${vid}.optimized.mp4"

  ffmpeg -y -i "$vid" \
    -c:v libx264 -crf 28 -preset slow \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -loglevel error \
    "$tmp_vid" 2>/dev/null || { rm -f "$tmp_vid"; continue; }

  if [ -f "$tmp_vid" ]; then
    size_after=$(wc -c < "$tmp_vid" | tr -d ' ')
    if [ "$size_after" -lt "$size_before" ]; then
      mv "$tmp_vid" "$vid"
      saved=$(( (size_before - size_after) / 1024 ))
      total_saved=$((total_saved + saved))
      count=$((count + 1))
    else
      rm -f "$tmp_vid"
    fi
  fi
done

echo "ok|${count}|${total_saved}"
