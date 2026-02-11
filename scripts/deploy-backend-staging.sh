#!/bin/bash
set -e

echo "🚀 Deploying Backend to Cloud Run (Staging)"
echo "============================================="

# Configuration
PROJECT_ID="unclutr-monorep"
SERVICE_NAME="squareup-backend-staging"
REGION="us-central1"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set project
echo "📦 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Prepare Firebase credentials as single-line JSON
echo "🔐 Preparing Firebase credentials..."
FIREBASE_CREDS=$(cat backend/firebase-credentials.json | jq -c .)

# Create environment variables YAML file
echo "📝 Creating environment variables file..."
cat > /tmp/cloud-run-env.yaml <<EOF
FIREBASE_CREDENTIALS_JSON: '$FIREBASE_CREDS'
EOF

echo ""
echo "⚠️  IMPORTANT: Database Configuration Required"
echo "=============================================="
echo "The DATABASE_URL environment variable must be set for the backend to work."
echo ""
echo "Current deployment will update Firebase credentials only."
echo "To also set DATABASE_URL, add it to /tmp/cloud-run-env.yaml before deploying:"
echo ""
echo "DATABASE_URL: 'postgresql+asyncpg://user:password@host:port/database'"
echo ""
read -p "Press Enter to continue with deployment, or Ctrl+C to cancel..."

# Update Cloud Run service
echo ""
echo "☁️  Updating Cloud Run service..."
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --env-vars-file=/tmp/cloud-run-env.yaml

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Service URL: https://squareup-backend-staging-527397315020.us-central1.run.app"
echo ""
echo "📋 Next Steps:"
echo "1. Set DATABASE_URL environment variable if not already set"
echo "2. Verify the deployment: curl https://squareup-backend-staging-527397315020.us-central1.run.app/health"
echo "3. Check logs: gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50"
