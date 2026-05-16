import os
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SquareUp"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"  # development | staging | production
    
    # Firebase Configuration
    # Validate path relative to backend root to be safe
    # backend/app/core/config.py -> backend/
    _BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    FIREBASE_CREDENTIALS_PATH: str = os.path.join(_BACKEND_DIR, "firebase-credentials.json")
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None
    FIREBASE_API_KEY: Optional[str] = None
    
    # Google Cloud
    GOOGLE_CLOUD_PROJECT: str = "squareup-492617"
    GOOGLE_CLOUD_LOCATION: str = "asia-south1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://param@localhost:5432/postgres")
    
    # Security - Dev Auth (DISABLE IN PRODUCTION!)
    ENABLE_DEV_AUTH: bool = True  # Set to False in production
    SWAGGER_DEV_PASSWORD: str = "admin"
    SWAGGER_DEV_TOKEN: str = "secret"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None

    # Shopify Integration
    SHOPIFY_API_KEY: Optional[str] = None
    SHOPIFY_API_SECRET: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    SHOPIFY_ENCRYPTION_KEY: Optional[str] = None
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # Google Calendar Integration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None

    # Bolna Voice AI Integration
    BOLNA_API_KEY: Optional[str] = None
    BOLNA_AGENT_ID: Optional[str] = None
    BOLNA_API_BASE_URL: str = "https://api.bolna.ai"

    # GCS — transcript stash (Phase 1 of the insights pipeline). When
    # GCS_TRANSCRIPTS_BUCKET is unset the webhook handler skips the upload
    # silently, so local dev without GCP creds still works.
    GCS_TRANSCRIPTS_BUCKET: Optional[str] = None
    # Either a filesystem path to a service-account JSON, or the JSON itself
    # inlined (production reads from Secret Manager and inlines).
    GCS_SERVICE_ACCOUNT_KEY: Optional[str] = None
    GCP_PROJECT_ID: Optional[str] = None
    # Hard ceiling on the GCS upload from inside the webhook handler — must be
    # short enough that a hung GCS does not blow Bolna's webhook retry budget.
    GCS_UPLOAD_TIMEOUT_SECONDS: float = 3.0

    # Cloud Tasks dispatch to insights-service. When CLOUD_TASKS_QUEUE_INSIGHTS
    # or INSIGHTS_SERVICE_URL is unset the webhook handler skips the dispatch
    # silently, so local dev without GCP creds still works.
    CLOUD_TASKS_PROJECT: Optional[str] = None
    CLOUD_TASKS_LOCATION: str = "asia-south1"
    CLOUD_TASKS_QUEUE_INSIGHTS: Optional[str] = None
    INSIGHTS_SERVICE_URL: Optional[str] = None
    # OIDC token signer identity — the SA the backend runs as on Cloud Run.
    # Cloud Tasks mints tokens with `email=<this SA>` and the receiver verifies.
    BACKEND_SA_EMAIL: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"
        
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

settings = Settings()
