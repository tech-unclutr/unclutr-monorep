# Deployment Guide: Almost (Staging) & Live (Production)

This guide outlines the process for deploying to the "Almost" (Staging) and "Live" (Production) environments and lists the required secrets.

## Deployment Process

The deployment is fully automated via GitHub Actions.

### To Deploy to Almost (Staging)
1.  Push code to the `squareup-almost` branch.
    ```bash
    git checkout squareup-almost
    git merge main  # or your feature branch
    git push origin squareup-almost
    ```
2.  The "Deploy SquareUp" workflow will automatically trigger.

### To Deploy to Live (Production)
1.  Push code to the `squareup-live` branch.
    ```bash
    git checkout squareup-live
    git merge squareup-almost # Promote from staging
    git push origin squareup-live
    ```
2.  The "Deploy SquareUp" workflow will automatically trigger.

## Required Secrets (GitHub Actions)

Ensure the following secrets are set in your GitHub repository settings under **Settings > Secrets and variables > Actions**.

### Shared Secrets (Used by both environments)
- `GCP_SA_KEY`: Google Cloud Service Account JSON key.
- `FIREBASE_TOKEN`: Token for Firebase CLI authentication.
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret.
- `SHOPIFY_ENCRYPTION_KEY`: Key for Shopify data encryption.
- `SHOPIFY_API_KEY`: Shopify App API Key.
- `SHOPIFY_API_SECRET`: Shopify App API Secret.
- `GEMINI_API_KEY`: Google Gemini API Key.
- `FIREBASE_CREDENTIALS_JSON`: Firebase Admin SDK Service Account JSON.
- `BOLNA_API_KEY`: API Key for Bolna Voice AI.
- `BOLNA_AGENT_ID`: Agent ID for Bolna Voice AI.

### Environment-Specific Secrets
- `DEV_DATABASE_URL`: Connection string for the **Staging** database.
- `PROD_DATABASE_URL`: Connection string for the **Production** database.

> [!IMPORTANT]
> The `DATABASE_URL` secrets should follow the format:
> `postgresql+asyncpg://<user>:<password>@<host>:5432/<dbname>`
> The GitHub Action automatically rewrites the host to use the Cloud SQL Proxy.
