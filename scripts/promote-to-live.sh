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

# ── CLI args (all optional — interactive prompts kick in when missing) ────────
SKIP_PROMPT=false
PRESET_VERSION=""
PRESET_NAME=""
PRESET_DESC=""
SYNC_DEV=true   # default: keep website-dev in lockstep with website-live

usage() {
  cat <<USAGE
Usage: $(basename "$0") [OPTIONS]

Promote website-dev → website-live with optimization, commit, tag, push,
then mirror the optimized build artifacts back to website-dev so the
two branches stay in lockstep.

Options:
  -y, --yes               Auto-confirm push to origin (skip the y/N prompt).
                          Required for non-interactive use (CI, piped stdin).
  -v, --version VERSION   Preset version (e.g. 1.10.0). Skips version prompt.
  -n, --name NAME         Preset release name. Skips name prompt.
  -d, --description DESC  Preset description. Skips description prompt.
  --no-sync-dev           Skip the post-promote dev-sync step. By default,
                          optimized artifacts (compressed media in public/)
                          are committed back to website-dev so dev mirrors
                          live exactly.
  -h, --help              Show this help and exit.

Examples:
  # Fully interactive (existing behavior + auto dev sync)
  ./scripts/promote-to-live.sh

  # Fully automated
  ./scripts/promote-to-live.sh -y -n "Bug fix release" -d "Fixed scroll bug"

  # Promote without touching website-dev (useful for hotfixes)
  ./scripts/promote-to-live.sh -y --no-sync-dev
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes)         SKIP_PROMPT=true; shift ;;
    -v|--version)     PRESET_VERSION="${2:-}"; shift 2 ;;
    -n|--name)        PRESET_NAME="${2:-}"; shift 2 ;;
    -d|--description) PRESET_DESC="${2:-}"; shift 2 ;;
    --no-sync-dev)    SYNC_DEV=false; shift ;;
    -h|--help)        usage; exit 0 ;;
    *)                echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

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

# ── Prompt: version (skipped if --version was passed) ────────────────────────
if [ -n "$PRESET_VERSION" ]; then
  VERSION="$PRESET_VERSION"
else
  echo -ne "  ${BOLD}Version${NC} [${SUGGESTED_VERSION}]: "
  read -r VERSION_INPUT
  VERSION=${VERSION_INPUT:-$SUGGESTED_VERSION}
fi
VERSION_TAG="website-v${VERSION}"
ok "Version: $VERSION_TAG"

# ── Prompt: release name (skipped if --name was passed) ──────────────────────
if [ -n "$PRESET_NAME" ]; then
  RELEASE_NAME="$PRESET_NAME"
else
  echo -ne "  ${BOLD}Release name${NC} (e.g. 'Hero redesign & CTA polish'): "
  read -r RELEASE_NAME
fi
if [ -z "$RELEASE_NAME" ]; then
  fail "Release name is required. This describes what went live."
fi
ok "Release: $RELEASE_NAME"

# ── Prompt: description (skipped if --description was passed) ────────────────
if [ -n "$PRESET_DESC" ]; then
  RELEASE_DESC="$PRESET_DESC"
else
  echo -ne "  ${BOLD}Description${NC} (optional summary — press Enter to skip): "
  read -r RELEASE_DESC
fi

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
  git rm -rf . > /dev/null 2>&1 || true
  git clean -fd > /dev/null 2>&1 || true
  ok "Switched to existing '$TARGET_BRANCH' and cleaned working tree"
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

if [ "$SKIP_PROMPT" = "true" ]; then
  PUSH_REPLY="y"
  log "Auto-pushing (--yes flag passed)"
else
  echo -e "  Push ${BOLD}$VERSION_TAG${NC} to origin? This will deploy to joinsquareup.com."
  echo -e "  (y/N)"
  # Read from /dev/tty when stdin isn't a terminal — prevents earlier stages
  # of a pipeline from accidentally eating the confirmation (which is what
  # killed two recent automated runs).
  if [ -t 0 ]; then
    read -r PUSH_REPLY
  elif [ -r /dev/tty ]; then
    read -r PUSH_REPLY < /dev/tty
  else
    fail "No TTY available and --yes not passed. Run with -y for non-interactive use."
  fi
fi

PUSHED_TO_LIVE=false
if [[ "$PUSH_REPLY" =~ ^[Yy]$ ]]; then
  git push origin "$TARGET_BRANCH" --force-with-lease 2>/dev/null || \
    git push origin "$TARGET_BRANCH" --force
  git push origin "$VERSION_TAG" 2>/dev/null || true
  ok "Pushed to origin/$TARGET_BRANCH"
  echo -e "\n${GREEN}${BOLD}  🚀 ${VERSION_TAG} deployed! Check GitHub Actions for progress.${NC}"
  echo -e "  ${BOLD}Release:${NC} ${RELEASE_NAME}\n"
  PUSHED_TO_LIVE=true
else
  ok "Changes committed locally but NOT pushed."
  log "Run 'git push origin $TARGET_BRANCH --force-with-lease && git push origin $VERSION_TAG' when ready."
fi

# Capture the live commit SHA *now* — we use it in the next step to pull
# optimized artifacts back to website-dev. (Doing this before any branch
# switching avoids ambiguity if TARGET_BRANCH ref shifts.)
LIVE_COMMIT_SHA=$(git rev-parse "$TARGET_BRANCH")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6: Mirror optimized artifacts back to website-dev
# ══════════════════════════════════════════════════════════════════════════════
#
# Why: optimize-for-prod.sh compresses media (videos, posters, og-image, etc.)
# with non-deterministic encoders. Without this step, dev's source media
# drifts from live's compressed output after every release, and we keep
# having to manually re-sync. This step keeps the two branches in lockstep
# automatically.
#
# What syncs: ONLY website/public/ — that's where compressed binary
# artifacts live. Source code optimizations from optimize-for-prod (console
# stripping, dev-file removal) deliberately stay live-only — dev needs its
# console.log statements and setup scripts for actual development.
# ══════════════════════════════════════════════════════════════════════════════

if [ "$SYNC_DEV" = "true" ] && [ "$PUSHED_TO_LIVE" = "true" ]; then
  header "Step 6: Syncing optimized artifacts to $SOURCE_BRANCH"

  # Disable -e locally so individual failures don't abort — live is already
  # pushed at this point; the worst case is the user re-runs sync manually.
  set +e

  git fetch origin "$SOURCE_BRANCH" > /dev/null 2>&1
  git checkout "$SOURCE_BRANCH" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    warn "Could not switch to $SOURCE_BRANCH — skipping sync"
    set -e
  else
    ok "Switched to $SOURCE_BRANCH"

    # Fast-forward to remote tip if possible (no merge commits, never force)
    git pull --ff-only origin "$SOURCE_BRANCH" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      warn "Could not fast-forward $SOURCE_BRANCH from origin (may have diverged)"
    fi

    # Mirror only the build-artifact directory from the live commit.
    # public/ is what optimize-for-prod compresses; everything else in
    # website/ should already match dev (since live was built FROM dev).
    #
    # Wipe-then-restore ensures true parity (handles additions, mods, AND
    # deletions). Plain `git checkout PATH` only adds/modifies, so files
    # removed by optimize would stay stale on dev otherwise.
    git rm -rf website/public > /dev/null 2>&1
    git checkout "$LIVE_COMMIT_SHA" -- website/public 2>/dev/null
    if [ $? -ne 0 ]; then
      warn "Could not checkout website/public from $LIVE_COMMIT_SHA — skipping sync"
      # Restore dev's public/ so we don't leave the tree in a broken state
      git checkout HEAD -- website/public 2>/dev/null
      set -e
    else
      git add -A website/public 2>/dev/null

      if git diff --cached --quiet 2>/dev/null; then
        log "$SOURCE_BRANCH already in sync with $VERSION_TAG — no commit needed"
      else
        SYNC_MSG_BODY="Auto-generated by promote-to-live.sh after each release.
Mirrors website/public/ from $VERSION_TAG so dev stays byte-identical
to live's optimized output. Source code changes from optimize-for-prod
(console stripping, dev-file removal) intentionally stay live-only —
dev needs those files for actual development."

        git commit -m "sync($SOURCE_BRANCH): mirror optimized public/ from $VERSION_TAG" \
                   -m "$SYNC_MSG_BODY" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
          ok "Committed sync to $SOURCE_BRANCH"

          git push origin "$SOURCE_BRANCH" > /dev/null 2>&1
          if [ $? -eq 0 ]; then
            ok "Pushed sync to origin/$SOURCE_BRANCH"
          else
            warn "Sync committed locally but push failed — run 'git push origin $SOURCE_BRANCH' manually"
          fi
        else
          warn "Sync commit failed — inspect manually"
        fi
      fi

      set -e
    fi
  fi
elif [ "$SYNC_DEV" = "false" ]; then
  log "Skipping dev sync (--no-sync-dev passed)"
else
  log "Skipping dev sync (live was not pushed)"
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEP 7: Return to original branch
# ══════════════════════════════════════════════════════════════════════════════

if [ "$(git branch --show-current)" != "$ORIGINAL_BRANCH" ]; then
  git checkout "$ORIGINAL_BRANCH"
fi
ok "Back on '$ORIGINAL_BRANCH'"

echo ""
header "DONE"
echo -e "  ${BOLD}${VERSION_TAG}${NC} — ${RELEASE_NAME}"
echo -e "  ${BOLD}$TARGET_BRANCH${NC} contains ONLY website files, fully optimized."
if [ "$SYNC_DEV" = "true" ] && [ "$PUSHED_TO_LIVE" = "true" ]; then
  echo -e "  ${BOLD}$SOURCE_BRANCH${NC} mirrors live's optimized artifacts."
fi
echo ""
