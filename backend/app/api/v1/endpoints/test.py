from fastapi import APIRouter, Depends
from app.core import security

router = APIRouter()

@router.get("/me")
def read_user_me(current_user: dict = Depends(security.get_current_user)):
    """
    Test endpoint that requires a valid Firebase Token.
    """
    return {
        "user_id": current_user.get("uid"),
        "email": current_user.get("email"),
        "message": "You are authenticated!"
    }
