#!/bin/bash
# Helper script to get Firebase credentials as single-line JSON for GitHub Secrets

echo "==================================================================="
echo "Firebase Credentials for GitHub Secrets"
echo "==================================================================="
echo ""
echo "Copy the output below and add it as a GitHub Secret:"
echo "1. Go to: https://github.com/tech-unclutr/unclutr-monorep/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: FIREBASE_CREDENTIALS_JSON"
echo "4. Value: Paste the JSON below"
echo ""
echo "-------------------------------------------------------------------"
cat /Users/param/Documents/Unclutr/backend/firebase-credentials.json | jq -c .
echo ""
echo "-------------------------------------------------------------------"
echo ""
echo "✅ After adding the secret, commit and push the updated deploy.yml"
echo "   to trigger the deployment with Firebase credentials included."
echo ""
