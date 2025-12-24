from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Unclutr.ai"
    API_V1_STR: str = "/api/v1"
    
    # TODO: [USER ACTION REQUIRED] 
    # Download your service account key from Firebase Console -> Service Accounts
    # Save it as 'firebase-credentials.json' in the backend/ directory
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    
    # FOR PRODUCTION: Pass the JSON content as a string env var
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None
    
    GOOGLE_CLOUD_PROJECT: str = "unclutr-monorep"
    GOOGLE_CLOUD_LOCATION: str = "us-central1"
    
    class Config:
        env_file = ".env"

settings = Settings()
