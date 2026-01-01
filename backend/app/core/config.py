from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Unclutr.ai"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"  # development | staging | production
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None
    FIREBASE_API_KEY: Optional[str] = None
    
    # Google Cloud
    GOOGLE_CLOUD_PROJECT: str = "unclutr-monorep"
    GOOGLE_CLOUD_LOCATION: str = "us-central1"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://param@localhost:5432/postgres"  # Updated for Data Connect / Local Postgres
    
    # Security - Dev Auth (DISABLE IN PRODUCTION!)
    ENABLE_DEV_AUTH: bool = True  # Set to False in production
    SWAGGER_DEV_PASSWORD: str = os.getenv("DEV_PASSWORD", "")
    SWAGGER_DEV_TOKEN: str = os.getenv("DEV_TOKEN", "")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None

    class Config:
        env_file = ".env"
        
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

settings = Settings()
