---
description: Promote Staging to Live (Production)
---
This workflow promotes the code from `squareup-almost` (Staging) to `squareup-live` (Production) by merging and pushing.

1. Checkout `squareup-live`.
2. Merge `squareup-almost` into `squareup-live`.
3. Push to `origin squareup-live`.
4. Return to original branch.

// turbo
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🚀 Promoting Staging (Almost) to Live (Production)..."

# Ensure we have the latest references
git fetch origin

# Checkout target branch
git checkout squareup-live
git pull origin squareup-live

# Merge staging branch
echo "🔀 Merging squareup-almost into squareup-live..."
git merge origin/squareup-almost --no-edit

# Push to trigger deployment
echo "qc Pushing to trigger deployment..."
git push origin squareup-live

# Return to original branch
echo "🔙 Returning to $CURRENT_BRANCH..."
git checkout "$CURRENT_BRANCH"

echo "✅ Live Deployment triggered! Monitor progress in GitHub Actions."
```
