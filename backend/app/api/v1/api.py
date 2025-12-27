from fastapi import APIRouter
from app.api.v1.endpoints import test, auth, health, onboarding, dev, datasources

api_router = APIRouter()
api_router.include_router(test.router, prefix="/test", tags=["Test"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(dev.router, prefix="/dev", tags=["Dev"])
api_router.include_router(datasources.router, prefix="/datasources", tags=["Datasources"])
