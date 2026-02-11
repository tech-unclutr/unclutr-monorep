#!/bin/bash
# Pre-flight checks and push to staging
set -e

echo "🔍 Running pre-deployment checks..."

# 1. Ensure we are on the squareup-almost branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "squareup-almost" ]; then
    echo "❌ Error: Not on squareup-almost branch. Actual: $CURRENT_BRANCH"
    exit 1
fi

# 2. Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# 3. Pull latest changes
echo "📥 Pulling latest changes from origin..."
git pull origin squareup-almost --rebase

echo "🚀 Pushing to staging (almost)..."
git push origin squareup-almost

echo "✅ Deployment triggered! Track progress at: https://github.com/tech-unclutr/unclutr-monorep/actions"
