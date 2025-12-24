from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import text
from app.core.db import get_session
import firebase_admin
from firebase_admin import auth

router = APIRouter()

@router.get("/full")
async def health_check_full(session: AsyncSession = Depends(get_session)):
    """
    Comprehensive Health Check for the Developer Dashboard.
    Checks: Database, Firebase Admin, API Status.
    """
    status_report = {
        "api": "online",
        "database": "unknown",
        "firebase": "unknown",
        "vertex_ai": "pending_sdk" # Placeholder until SDK integration
    }

    # 1. Database Check
    try:
        await session.exec(text("SELECT 1"))
        status_report["database"] = "connected"
    except Exception as e:
        status_report["database"] = f"error: {str(e)}"

    # 2. Firebase Check
    try:
        # Just checking if the app is initialized
        if firebase_admin._apps:
            status_report["firebase"] = "connected"
        else:
            status_report["firebase"] = "not_initialized"
    except Exception as e:
        status_report["firebase"] = f"error: {str(e)}"

    return status_report
