# GCP & Firebase Authentication Setup

How the SquareUp backend authenticates to GCP services (Cloud SQL, Cloud Run, Firebase) — both in CI/CD and at runtime.

We use **two keyless authentication mechanisms** instead of long-lived JSON service account keys:

1. **Workload Identity Federation (WIF)** — for GitHub Actions → GCP
2. **Application Default Credentials (ADC)** — for Cloud Run → Firebase Admin SDK

Both are required by the org policy `constraints/iam.disableServiceAccountKeyCreation`, which blocks JSON key generation for security reasons.

---

## Configuration Reference

Replace these placeholders with the actual values for your environment (kept out of source control):

| Placeholder | Description |
|---|---|
| `<PROJECT_ID>` | GCP project ID |
| `<PROJECT_NUMBER>` | Numeric GCP project number |
| `<REGION>` | GCP region (e.g. `asia-south1`) |
| `<GITHUB_ORG>/<GITHUB_REPO>` | GitHub repository in `org/repo` format |
| `<CLOUD_SQL_INSTANCE>` | Cloud SQL instance name |
| `<DB_NAME>` | Database name inside the instance |
| `<DEPLOY_SA_NAME>` | Deploy service account local part (e.g. `github-deployer`) |
| `<RUNTIME_SA>` | Cloud Run runtime service account email |
| `<CLOUD_RUN_SERVICE>` | Cloud Run service name |

---

## Part 1: GitHub Actions → GCP (Workload Identity Federation)

GitHub Actions authenticates to GCP via OIDC tokens — no JSON key file required.

### One-time setup

```bash
# Set variables
PROJECT_ID="<PROJECT_ID>"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
POOL="github-pool"
PROVIDER="github-provider"
SA_EMAIL="<DEPLOY_SA_NAME>@${PROJECT_ID}.iam.gserviceaccount.com"
GITHUB_REPO="<GITHUB_ORG>/<GITHUB_REPO>"

# 1. Enable required APIs
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID
gcloud services enable sts.googleapis.com --project=$PROJECT_ID

# 2. Create the Workload Identity Pool
gcloud iam workload-identity-pools create $POOL \
  --project=$PROJECT_ID \
  --location=global \
  --display-name="GitHub Actions Pool"

# 3. Create the OIDC provider for GitHub
gcloud iam workload-identity-pools providers create-oidc $PROVIDER \
  --project=$PROJECT_ID \
  --location=global \
  --workload-identity-pool=$POOL \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 4. Allow the GitHub repo to impersonate the deploy service account
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${GITHUB_REPO}"

# 5. Print values for GitHub secrets
echo ""
echo "=========================================="
echo "GCP_WORKLOAD_IDENTITY_PROVIDER ="
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"
echo ""
echo "GCP_SERVICE_ACCOUNT ="
echo "${SA_EMAIL}"
echo "=========================================="
```

### Required IAM roles on the deploy service account

```bash
SA_EMAIL="<DEPLOY_SA_NAME>@<PROJECT_ID>.iam.gserviceaccount.com"

for ROLE in \
  roles/cloudsql.client \
  roles/run.admin \
  roles/iam.serviceAccountUser \
  roles/cloudbuild.builds.editor \
  roles/storage.admin \
  roles/artifactregistry.writer \
  roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding <PROJECT_ID> \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None
done
```

### GitHub secrets to add

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Output from step 5 above (`projects/.../providers/github-provider`) |
| `GCP_SERVICE_ACCOUNT` | `<DEPLOY_SA_NAME>@<PROJECT_ID>.iam.gserviceaccount.com` |

`GCP_SA_KEY` is **no longer used** and should be deleted after the first successful WIF deploy.

### Workflow configuration

The workflow at `.github/workflows/deploy.yml` uses:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write       # Required for OIDC token exchange
    steps:
      - name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
```

---

## Part 2: Cloud Run → Firebase Admin SDK (Application Default Credentials)

Firebase Admin SDK on Cloud Run authenticates via the runtime service account — no JSON credentials file required.

### How it works

`firebase_admin.initialize_app()` (no args) resolves credentials in this order:

1. `GOOGLE_APPLICATION_CREDENTIALS` env var (path to a key file) — not used
2. **Runtime service account attached to Cloud Run** — used in production
3. `gcloud auth application-default login` credentials — used for local dev

The init logic lives in [`backend/app/core/security.py`](../backend/app/core/security.py) and falls through to ADC when neither `FIREBASE_CREDENTIALS_JSON` nor a local credentials file is present.

### One-time setup — grant Firebase roles to runtime SA

```bash
PROJECT_ID="<PROJECT_ID>"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Firebase Admin SDK access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/firebase.sdkAdminServiceAgent"

# Required for verifying Firebase ID tokens
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

If Cloud Run uses a custom runtime SA (not the default Compute SA), check with:

```bash
gcloud run services describe <CLOUD_RUN_SERVICE> \
  --region=<REGION> \
  --format='value(spec.template.spec.serviceAccountName)'
```

…and use that one instead.

### Local development

Run once on your machine:

```bash
gcloud auth application-default login
gcloud config set project <PROJECT_ID>
gcloud auth application-default set-quota-project <PROJECT_ID>
```

This creates `~/.config/gcloud/application_default_credentials.json` which Firebase Admin SDK picks up automatically.

### Verifying it works

Check Cloud Run logs after deploy. You should see:

```
Firebase initialized via Application Default Credentials.
```

If you see `Failed to initialize Firebase via ADC: ...`, the IAM grant didn't apply — re-run the role bindings above.

### Cleanup after migration

Once ADC is confirmed working in Cloud Run:

1. **Delete `FIREBASE_CREDENTIALS_JSON`** from GitHub Actions secrets
2. **Remove `FIREBASE_CREDENTIALS_JSON_SECRET`** from `.github/workflows/deploy.yml`
3. **Remove Firebase credentials handling** from `backend/scripts/generate_deploy_env.py`

---

## Part 3: Cloud SQL Instance Configuration

The dev database instance was created with this command:

```bash
gcloud sql instances create <CLOUD_SQL_INSTANCE> \
  --database-version=POSTGRES_16 \
  --region=<REGION> \
  --tier=db-g1-small \
  --edition=ENTERPRISE \
  --storage-size=10GB \
  --storage-type=HDD \
  --availability-type=ZONAL \
  --no-backup \
  --deletion-protection
```

**Estimated cost:** ~$26/month (no HA, no backups, HDD storage — dev-optimized).

### Database & user setup

```bash
# Create the dev database
gcloud sql databases create <DB_NAME> \
  --instance=<CLOUD_SQL_INSTANCE> \
  --project=<PROJECT_ID>

# Set password on default postgres user
gcloud sql users set-password postgres \
  --instance=<CLOUD_SQL_INSTANCE> \
  --project=<PROJECT_ID> \
  --password=<YOUR_STRONG_PASSWORD>
```

### Connection string format

`DEV_DATABASE_URL` (GitHub secret):

```
postgresql+asyncpg://postgres:<YOUR_PASSWORD>@/<DB_NAME>?host=/cloudsql/<PROJECT_ID>:<REGION>:<CLOUD_SQL_INSTANCE>
```

URL-encode special characters in the password: `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`.

The deploy workflow rewrites the host to `127.0.0.1:5432` for migration runs (via Cloud SQL Auth Proxy) — so the same secret works for both runtime and migrations.

---

## Why no JSON keys?

The org policy `constraints/iam.disableServiceAccountKeyCreation` blocks `gcloud iam service-accounts keys create` for all service accounts in this project. This is a deliberate security control — JSON keys don't expire, can't be easily rotated, and leak via committed `.env` files, screenshots, and logs.

WIF + ADC eliminate the need for keys entirely:

| Approach | Key Rotation | Leak Risk | Setup Effort |
|---|---|---|---|
| JSON Service Account Key | Manual, frequent | High | Low |
| **Workload Identity Federation** | **None needed** | **Very low** | **Medium (one-time)** |
| **Application Default Credentials** | **None needed** | **None** | **Very low** |

---

## Troubleshooting

### `Permission denied on resource project <PROJECT_ID>`
The deploy service account is missing roles. Re-run the role-binding loop in Part 1.

### `Unable to acquire impersonation credentials`
The WIF attribute condition doesn't match the GitHub repo. Verify the provider config matches `<GITHUB_ORG>/<GITHUB_REPO>` exactly.

### `iamcredentials.googleapis.com not enabled`
Run: `gcloud services enable iamcredentials.googleapis.com --project=<PROJECT_ID>`

### `Failed to initialize Firebase via ADC: ...` in Cloud Run logs
Runtime SA lacks Firebase roles. Re-run the role bindings in Part 2.

### Local Firebase Admin calls fail with `DefaultCredentialsError`
Run: `gcloud auth application-default login`

### Cloud SQL connection times out from Cloud Run
Verify the `--add-cloudsql-instances` flag in `deploy.yml` uses the correct connection name: `<PROJECT_ID>:<REGION>:<CLOUD_SQL_INSTANCE>`.
