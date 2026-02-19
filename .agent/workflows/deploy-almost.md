---
description: Deploy current branch to Almost (Staging)
---
This workflow merges the current branch into `squareup-almost` and pushes it to trigger the staging deployment.

1. Get current branch name.
2. Checkout `squareup-almost` and pull latest changes.
3. Merge current branch into `squareup-almost`.
4. Push to `origin squareup-almost`.
5. Return to original branch.

// turbo
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🚀 Deploying $CURRENT_BRANCH to Almost (Staging)..."

# Ensure we have the latest references
git fetch origin

# Checkout target branch
git checkout squareup-almost
git pull origin squareup-almost

# Merge current branch
echo "🔀 Merging $CURRENT_BRANCH into squareup-almost..."
git merge "$CURRENT_BRANCH" --no-edit

# Push to trigger deployment
echo "qc Pushing to trigger deployment..."
git push origin squareup-almost

# Return to original branch
echo "🔙 Returning to $CURRENT_BRANCH..."
git checkout "$CURRENT_BRANCH"

echo "✅ Deployment triggered! Monitor progress in GitHub Actions."
```
