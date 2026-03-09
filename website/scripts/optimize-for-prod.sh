#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# optimize-for-prod.sh — Transform website/ source into production-grade code
# ══════════════════════════════════════════════════════════════════════════════
# Run from the repo root:  ./website/scripts/optimize-for-prod.sh
#
# This script modifies files IN-PLACE. It is designed to run on a working tree
# that will be committed to website-live. Do NOT run on website-dev directly.
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Resolve paths ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBSITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEBSITE_DIR/.." && pwd)"
PUBLIC_DIR="$WEBSITE_DIR/public"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${CYAN}[optimize]${NC} $*"; }
ok()     { echo -e "${GREEN}  ✓${NC} $*"; }
warn()   { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail()   { echo -e "${RED}  ✗${NC} $*"; }
header() { echo -e "\n${BOLD}━━━ $* ━━━${NC}"; }

# ── Capture initial sizes ─────────────────────────────────────────────────────

INITIAL_PUBLIC_SIZE=$(du -sk "$PUBLIC_DIR" 2>/dev/null | cut -f1)

# ══════════════════════════════════════════════════════════════════════════════
# 1. STRIP UNGUARDED console.* STATEMENTS
# ══════════════════════════════════════════════════════════════════════════════

header "1/7  Stripping unguarded console statements"

STRIPPED=$(node "$SCRIPT_DIR/strip-console.js" "$WEBSITE_DIR")
ok "Stripped $STRIPPED unguarded console statement(s)"

# Also strip debugger statements
DEBUGGER_COUNT=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  -l '^\s*debugger\s*;' "$WEBSITE_DIR" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=out --exclude-dir=pitch-deck 2>/dev/null | wc -l | tr -d ' ' || echo "0")

if [ "$DEBUGGER_COUNT" -gt 0 ]; then
  find "$WEBSITE_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/out/*" ! -path "*/pitch-deck/*" \
    -exec sed -i '' '/^\s*debugger\s*;/d' {} +
  ok "Removed debugger statements from $DEBUGGER_COUNT file(s)"
else
  ok "No debugger statements found"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 2. OPTIMIZE SVGs
# ══════════════════════════════════════════════════════════════════════════════

header "2/7  Optimizing SVGs"

SVG_COUNT=$(find "$PUBLIC_DIR" -name "*.svg" -not -path "*/investors/*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$SVG_COUNT" -gt 0 ]; then
  SVG_SIZE_BEFORE=$(find "$PUBLIC_DIR" -name "*.svg" -not -path "*/investors/*" -exec du -ck {} + 2>/dev/null | tail -1 | cut -f1)

  npx --yes svgo@latest --multipass --quiet \
    --folder "$PUBLIC_DIR" \
    --exclude "**/investors/**" \
    2>/dev/null || warn "svgo had warnings (non-fatal)"

  SVG_SIZE_AFTER=$(find "$PUBLIC_DIR" -name "*.svg" -not -path "*/investors/*" -exec du -ck {} + 2>/dev/null | tail -1 | cut -f1)
  SAVED=$((SVG_SIZE_BEFORE - SVG_SIZE_AFTER))
  ok "Optimized $SVG_COUNT SVG(s), saved ${SAVED}KB"
else
  ok "No SVGs to optimize"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 3. COMPRESS RASTER IMAGES (WebP, PNG, JPG)
# ══════════════════════════════════════════════════════════════════════════════

header "3/7  Compressing raster images"

RESULT=$(node "$SCRIPT_DIR/compress-images.js" "$PUBLIC_DIR" 2>/dev/null || echo "0|0")
IMG_COUNT=$(echo "$RESULT" | cut -d'|' -f1)
IMG_SAVED=$(echo "$RESULT" | cut -d'|' -f2)
ok "Compressed $IMG_COUNT image(s), saved ${IMG_SAVED}KB"

# ══════════════════════════════════════════════════════════════════════════════
# 4. COMPRESS VIDEOS (MP4)
# ══════════════════════════════════════════════════════════════════════════════

header "4/7  Compressing videos"

if command -v ffmpeg &>/dev/null; then
  VIDEO_TOTAL_SAVED=0
  VIDEO_COUNT=0

  while IFS= read -r vid; do
    [ -z "$vid" ] && continue
    SIZE_BEFORE=$(stat -f%z "$vid" 2>/dev/null || stat -c%s "$vid" 2>/dev/null)
    TMP_VID="${vid}.optimized.mp4"

    # -crf 28: good compression, visually near-identical
    # -preset slow: better compression at cost of encode time
    # -movflags +faststart: streaming-friendly
    ffmpeg -y -i "$vid" \
      -c:v libx264 -crf 28 -preset slow \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      -loglevel error \
      "$TMP_VID" 2>/dev/null || true

    if [ -f "$TMP_VID" ]; then
      SIZE_AFTER=$(stat -f%z "$TMP_VID" 2>/dev/null || stat -c%s "$TMP_VID" 2>/dev/null)
      if [ "$SIZE_AFTER" -lt "$SIZE_BEFORE" ]; then
        mv "$TMP_VID" "$vid"
        SAVED=$(( (SIZE_BEFORE - SIZE_AFTER) / 1024 ))
        VIDEO_TOTAL_SAVED=$((VIDEO_TOTAL_SAVED + SAVED))
        VIDEO_COUNT=$((VIDEO_COUNT + 1))
      else
        rm -f "$TMP_VID"
      fi
    fi
  done < <(find "$PUBLIC_DIR" -name "*.mp4" -not -path "*/investors/*" 2>/dev/null)

  ok "Compressed $VIDEO_COUNT video(s), saved ${VIDEO_TOTAL_SAVED}KB"
else
  warn "ffmpeg not found — skipping video compression"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 5. REMOVE DEV-ONLY FILES
# ══════════════════════════════════════════════════════════════════════════════

header "5/7  Removing dev-only files"

DEV_FILES_REMOVED=0

# Remove test recordings
if find "$PUBLIC_DIR" -name "*.mov" -delete 2>/dev/null; then
  DEV_FILES_REMOVED=$((DEV_FILES_REMOVED + 1))
fi

# Remove GA4 setup log
if [ -f "$WEBSITE_DIR/ga4-setup.log" ]; then
  rm "$WEBSITE_DIR/ga4-setup.log"
  DEV_FILES_REMOVED=$((DEV_FILES_REMOVED + 1))
fi

# Remove test files
if [ -d "$WEBSITE_DIR/tests" ]; then
  rm -rf "$WEBSITE_DIR/tests"
  DEV_FILES_REMOVED=$((DEV_FILES_REMOVED + 1))
fi

# Remove GA4 setup script (dev-only)
if [ -f "$WEBSITE_DIR/scripts/setup-ga4.mjs" ]; then
  rm "$WEBSITE_DIR/scripts/setup-ga4.mjs"
  DEV_FILES_REMOVED=$((DEV_FILES_REMOVED + 1))
fi

ok "Cleaned up $DEV_FILES_REMOVED dev-only file(s)/dir(s)"

# ══════════════════════════════════════════════════════════════════════════════
# 6. REGENERATE SITEMAP
# ══════════════════════════════════════════════════════════════════════════════

header "6/7  Regenerating sitemap"

TODAY=$(date +%Y-%m-%d)

cat > "$PUBLIC_DIR/sitemap.xml" <<SITEMAP_EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://joinsquareup.com</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://joinsquareup.com/pilot</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
SITEMAP_EOF

ok "Sitemap updated with date $TODAY"

# ══════════════════════════════════════════════════════════════════════════════
# 7. VALIDATE BUILD
# ══════════════════════════════════════════════════════════════════════════════

header "7/7  Validating production build"

cd "$WEBSITE_DIR"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  log "Installing dependencies..."
  npm ci --prefer-offline 2>&1 | tail -1
fi

log "Running next build..."
if npm run build 2>&1 | tail -5; then
  ok "Production build succeeded"
else
  fail "Production build FAILED — aborting!"
  exit 1
fi

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

FINAL_PUBLIC_SIZE=$(du -sk "$PUBLIC_DIR" 2>/dev/null | cut -f1)
TOTAL_SAVED=$((INITIAL_PUBLIC_SIZE - FINAL_PUBLIC_SIZE))

echo ""
header "OPTIMIZATION COMPLETE"
echo -e "  ${BOLD}Public folder:${NC} ${INITIAL_PUBLIC_SIZE}KB -> ${FINAL_PUBLIC_SIZE}KB (saved ${TOTAL_SAVED}KB)"
echo -e "  ${BOLD}Console logs:${NC}  $STRIPPED unguarded statement(s) stripped"
echo -e "  ${BOLD}Build:${NC}         Production build verified"
echo ""
