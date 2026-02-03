from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Unclutr.ai"
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
    GOOGLE_CLOUD_PROJECT: str = "unclutr-monorep"
    GOOGLE_CLOUD_LOCATION: str = "us-central1"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://param@localhost:5432/postgres"  # Updated for Data Connect / Local Postgres
    
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

    class Config:
        env_file = "env.config"
        extra = "ignore"
        
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

settings = Settings()
