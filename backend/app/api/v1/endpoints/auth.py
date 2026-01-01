from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core import security
from app.core.db import get_session
from app.models.user import User, UserRead, UserCreate
from app.services import auth_service

router = APIRouter()

@router.post("/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login. 
    1. Checks for Swagger Dev Password (admin).
    2. If not dev, attempts real Firebase Auth (Email/Password).
    """
    from app.core.config import settings
    import httpx
    
    # 1. Check Dev Password (only if enabled)
    if settings.ENABLE_DEV_AUTH and form_data.password == settings.SWAGGER_DEV_PASSWORD:
        return {"access_token": settings.SWAGGER_DEV_TOKEN, "token_type": "bearer"}
    elif not settings.ENABLE_DEV_AUTH and form_data.password == settings.SWAGGER_DEV_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Dev authentication is disabled in this environment",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Attempt Real Firebase Auth
    if not settings.FIREBASE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password and FIREBASE_API_KEY not configured for real auth.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    firebase_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_API_KEY}"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                firebase_url,
                json={
                    "email": form_data.username,
                    "password": form_data.password,
                    "returnSecureToken": True
                }
            )
            
            if resp.status_code != 200:
                error_data = resp.json()
                error_msg = error_data.get("error", {}).get("message", "Invalid credentials")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Firebase Auth Failed: {error_msg}",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            data = resp.json()
            return {"access_token": data["idToken"], "token_type": "bearer"}
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Auth Service Error: {str(e)}"
            )

@router.post("/sync", response_model=UserRead)
async def sync_user_endpoint(
    current_user_token: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Syncs Firebase User to Local DB. 
    Call this after Firebase Login on Frontend.
    """
    uid = current_user_token.get("uid")
    email = current_user_token.get("email")
    if not uid or not email:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    
    user_in = UserCreate(
        id=uid,
        email=email,
        full_name=current_user_token.get("name"),
        picture_url=current_user_token.get("picture")
    )
    
    user = await auth_service.sync_user(session, user_in)
    return user
