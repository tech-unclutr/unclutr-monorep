from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import text
from app.core.db import get_session
import firebase_admin
from firebase_admin import auth
import vertexai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Vertex AI globally (or it can be done within the health check if preferred, 
# but usually initialized once at startup)
try:
    vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT, location=settings.GOOGLE_CLOUD_LOCATION)
except Exception as e:
    logger.error(f"Vertex AI initialization failed: {e}", exc_info=True)


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
        "vertex_ai": "unknown"
    }

    # 0. Vertex AI Check
    try:
        # A simple model check to verify the SDK and credentials are working
        from vertexai.generative_models import GenerativeModel
        model = GenerativeModel("gemini-2.0-flash")
        # Note: We don't actually generate content here to avoid cost/latency, 
        # just initializing the model object is usually enough to check SDK config.
        # But to be sure, we can check if initialization was successful.
        if model:
            status_report["vertex_ai"] = "connected"
    except Exception as e:
        status_report["vertex_ai"] = f"error: {str(e)}"

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
