#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# promote-to-live.sh — Selectively promote website code to website-live
# ══════════════════════════════════════════════════════════════════════════════
# Run from the repo root:  ./scripts/promote-to-live.sh
#
# This script:
#   1. Ensures your working tree is clean
#   2. Prompts for version, release name, and description
#   3. Checks out (or creates) website-live as a clean branch
#   4. Copies ONLY website-related files from website-dev (not backend/frontend)
#   5. Runs the full optimization pipeline on the code
#   6. Commits with version tag and descriptive changelog
#   7. Pushes website-live → triggers CI/CD → deploys to joinsquareup.com
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${CYAN}[promote]${NC} $*"; }
ok()     { echo -e "${GREEN}  ✓${NC} $*"; }
warn()   { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail()   { echo -e "${RED}  ✗${NC} $*"; exit 1; }
header() { echo -e "\n${BOLD}━━━ $* ━━━${NC}"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SOURCE_BRANCH="website-dev"
TARGET_BRANCH="website-live"
OPTIMIZE_SCRIPT="website/scripts/optimize-for-prod.sh"

# ── Files/dirs that belong to the website deployment ──────────────────────────
WEBSITE_PATHS=(
  "website/"
  "firebase.json"
  ".firebaserc"
  ".github/workflows/deploy-website.yml"
  ".gitignore"
)

# ══════════════════════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ══════════════════════════════════════════════════════════════════════════════

header "Pre-flight checks"

git rev-parse --git-dir > /dev/null 2>&1 || fail "Not a git repository"
ok "Git repository detected"

if [ -n "$(git status --porcelain)" ]; then
  fail "Working tree is dirty. Please commit or stash your changes first."
fi
ok "Working tree is clean"

if ! git rev-parse --verify "$SOURCE_BRANCH" > /dev/null 2>&1; then
  fail "Source branch '$SOURCE_BRANCH' does not exist"
fi
ok "Source branch '$SOURCE_BRANCH' exists"

ORIGINAL_BRANCH=$(git branch --show-current)
log "Currently on: $ORIGINAL_BRANCH"

SOURCE_COMMIT=$(git rev-parse --short "$SOURCE_BRANCH")

# ══════════════════════════════════════════════════════════════════════════════
# VERSION & RELEASE INFO
# ══════════════════════════════════════════════════════════════════════════════

header "Release info"

# Auto-detect next version from existing tags (website-v1.0.0, website-v1.1.0, etc.)
LATEST_TAG=$(git tag -l 'website-v*' --sort=-v:refname 2>/dev/null | head -1)

if [ -z "$LATEST_TAG" ]; then
  SUGGESTED_VERSION="1.0.0"
  LAST_TAG_COMMIT=""
else
  CURRENT_VER=${LATEST_TAG#website-v}
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VER"
  SUGGESTED_VERSION="${MAJOR}.$((MINOR + 1)).0"
  LAST_TAG_COMMIT=$(git rev-parse --short "$LATEST_TAG" 2>/dev/null || echo "")
fi

log "Latest version: ${LATEST_TAG:-none}"
log "Suggested next: website-v${SUGGESTED_VERSION}"
echo ""

# ── Prompt: version ───────────────────────────────────────────────────────────
echo -ne "  ${BOLD}Version${NC} [${SUGGESTED_VERSION}]: "
read -r VERSION_INPUT
VERSION=${VERSION_INPUT:-$SUGGESTED_VERSION}
VERSION_TAG="website-v${VERSION}"
ok "Version: $VERSION_TAG"

# ── Prompt: release name ─────────────────────────────────────────────────────
echo -ne "  ${BOLD}Release name${NC} (e.g. 'Hero redesign & CTA polish'): "
read -r RELEASE_NAME
if [ -z "$RELEASE_NAME" ]; then
  fail "Release name is required. This describes what went live."
fi
ok "Release: $RELEASE_NAME"

# ── Prompt: description ──────────────────────────────────────────────────────
echo -ne "  ${BOLD}Description${NC} (optional summary — press Enter to skip): "
read -r RELEASE_DESC

# ── Generate changelog: only major/final changes ──────────────────────────────
# Filters to meaningful commits (feat/fix/refactor/perf/style/deploy or merges)
if [ -n "$LAST_TAG_COMMIT" ]; then
  RAW_LOG=$(git log --oneline "${LAST_TAG_COMMIT}..${SOURCE_BRANCH}" -- website/ 2>/dev/null)
else
  RAW_LOG=$(git log --oneline -30 "$SOURCE_BRANCH" -- website/ 2>/dev/null)
fi

CHANGELOG=$(echo "$RAW_LOG" | grep -iE '^[a-f0-9]+ (feat|fix|refactor|perf|style|deploy|Merge)' | head -10)

echo ""
log "Changelog (commits since last release):"
if [ -n "$CHANGELOG" ]; then
  echo "$CHANGELOG" | while read -r line; do echo -e "    ${CYAN}•${NC} $line"; done
else
  echo -e "    ${YELLOW}(no website changes found)${NC}"
fi
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: Checkout/create website-live (orphan branch — clean slate)
# ══════════════════════════════════════════════════════════════════════════════

header "Step 1: Preparing $TARGET_BRANCH"

if git rev-parse --verify "$TARGET_BRANCH" > /dev/null 2>&1; then
  git checkout "$TARGET_BRANCH"
  ok "Switched to existing '$TARGET_BRANCH'"
else
  git checkout --orphan "$TARGET_BRANCH"
  git rm -rf --cached . > /dev/null 2>&1 || true
  git clean -fd > /dev/null 2>&1 || true
  ok "Created new orphan branch '$TARGET_BRANCH'"
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Selectively copy ONLY website files from website-dev
# ══════════════════════════════════════════════════════════════════════════════

header "Step 2: Copying website files from $SOURCE_BRANCH"

# Clean the working tree (except .git)
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} + 2>/dev/null || true

# Checkout only the website-related paths from website-dev
for p in "${WEBSITE_PATHS[@]}"; do
  if git checkout "$SOURCE_BRANCH" -- "$p" 2>/dev/null; then
    ok "Copied: $p"
  else
    warn "Not found in $SOURCE_BRANCH: $p"
  fi
done

FILE_COUNT=$(find . -not -path './.git/*' -not -name '.git' -type f | wc -l | tr -d ' ')
log "Copied $FILE_COUNT file(s) from $SOURCE_BRANCH"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Run optimizations
# ══════════════════════════════════════════════════════════════════════════════

header "Step 3: Running production optimizations"

if [ -x "$OPTIMIZE_SCRIPT" ]; then
  bash "$OPTIMIZE_SCRIPT"
else
  fail "Optimize script not found: $OPTIMIZE_SCRIPT"
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEP 4: Commit with version
# ══════════════════════════════════════════════════════════════════════════════

header "Step 4: Committing optimized code"

git add -A

# Build rich commit message
COMMIT_TITLE="${VERSION_TAG} — ${RELEASE_NAME}"

COMMIT_BODY=""
if [ -n "$RELEASE_DESC" ]; then
  COMMIT_BODY="${RELEASE_DESC}"
  COMMIT_BODY="${COMMIT_BODY}

"
fi

COMMIT_BODY="${COMMIT_BODY}Source: ${SOURCE_BRANCH}@${SOURCE_COMMIT}
Promoted: $(date +%Y-%m-%d\ %H:%M)"

if [ -n "$CHANGELOG" ]; then
  COMMIT_BODY="${COMMIT_BODY}

Changes included:"
  while IFS= read -r line; do
    COMMIT_BODY="${COMMIT_BODY}
  • ${line}"
  done <<< "$CHANGELOG"
fi

if git diff --cached --quiet 2>/dev/null; then
  warn "No changes to commit (website-live is already up-to-date)"
else
  git commit -m "${COMMIT_TITLE}" -m "${COMMIT_BODY}"
  ok "Committed: $COMMIT_TITLE"

  # Tag this release
  git tag -a "$VERSION_TAG" -m "${RELEASE_NAME}" 2>/dev/null || \
    warn "Tag $VERSION_TAG already exists, skipping"
  ok "Tagged: $VERSION_TAG"
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEP 5: Push
# ══════════════════════════════════════════════════════════════════════════════

header "Step 5: Pushing to origin"

echo -e "  Push ${BOLD}$VERSION_TAG${NC} to origin? This will deploy to joinsquareup.com."
echo -e "  (y/N)"
read -r PUSH_REPLY

if [[ "$PUSH_REPLY" =~ ^[Yy]$ ]]; then
  git push origin "$TARGET_BRANCH" --force-with-lease 2>/dev/null || \
    git push origin "$TARGET_BRANCH" --force
  git push origin "$VERSION_TAG" 2>/dev/null || true
  ok "Pushed to origin/$TARGET_BRANCH"
  echo -e "\n${GREEN}${BOLD}  🚀 ${VERSION_TAG} deployed! Check GitHub Actions for progress.${NC}"
  echo -e "  ${BOLD}Release:${NC} ${RELEASE_NAME}\n"
else
  ok "Changes committed locally but NOT pushed."
  log "Run 'git push origin $TARGET_BRANCH --force-with-lease && git push origin $VERSION_TAG' when ready."
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6: Return to original branch
# ══════════════════════════════════════════════════════════════════════════════

git checkout "$ORIGINAL_BRANCH"
ok "Back on '$ORIGINAL_BRANCH'"

echo ""
header "DONE"
echo -e "  ${BOLD}${VERSION_TAG}${NC} — ${RELEASE_NAME}"
echo -e "  ${BOLD}$TARGET_BRANCH${NC} contains ONLY website files, fully optimized."
echo ""
