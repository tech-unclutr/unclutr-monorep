import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import os

# Initialize Firebase App
# In production, use env vars. For local, we check if app is already init.
if not firebase_admin._apps:
    if settings.FIREBASE_CREDENTIALS_JSON:
        # Best Practice for Prod (Render/Railway/Vercel)
        import json
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    elif os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        # Fallback for Local Dev
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback or initialization without creds (e.g. on GCP)
        # For now, we print a warning
        print("Warning: Firebase Credentials not found. Auth will fail.")

security = HTTPBearer()

def get_current_user(res: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the Firebase credential.
    """
    token = res.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
