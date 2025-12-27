import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status, Security, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
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

security = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    res: HTTPAuthorizationCredentials = Security(security),
    oauth2_token: str = Depends(oauth2_scheme)
):
    """
    Validates the Firebase credential or Dev token.
    """
    token = res.credentials if res else oauth2_token
    
    # DEBUG: Check raw header to see if Proxy passed it
    raw_auth = request.headers.get("Authorization")
    
    if not token:
        # Fallback: Try to parse raw header manually if HTTPBearer failed
        if raw_auth and raw_auth.startswith("Bearer "):
             token = raw_auth.split(" ")[1]

    if not token:
        debug_msg = f"MISSING AUTH TOKEN. Raw Auth Header: '{raw_auth[:10] if raw_auth else 'None'}'"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=debug_msg,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check for Dev Token
    if token == settings.SWAGGER_DEV_TOKEN:
        return {
            "uid": "dev-user-123",
            "email": "dev@unclutr.ai",
            "name": "Developer User",
            "picture": "https://ui-avatars.com/api/?name=Dev+User",
            "is_dev": True
        }

    try:
        # print(f"DEBUG: Verifying token: {token[:10]}...") 
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"DEBUG: Auth Verification Failed: {e}")
        try:
            with open("auth_debug.txt", "w") as f:
                f.write(f"Error: {e}\n")
                import traceback
                traceback.print_exc(file=f)
        except:
            pass
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_no_depends(auth_header: str):
    """
    Helper for middleware to verify token without Depends()
    """
    token = auth_header.replace("Bearer ", "")
    
    if token == settings.SWAGGER_DEV_TOKEN:
        return {
            "uid": "dev-user-123",
            "email": "dev@unclutr.ai",
            "name": "Developer User",
            "picture": "https://ui-avatars.com/api/?name=Dev+User",
            "is_dev": True
        }
        
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials in middleware: {e}",
        )
