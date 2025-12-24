from fastapi import APIRouter
from app.api.v1.endpoints import test, auth, health

api_router = APIRouter()
api_router.include_router(test.router, prefix="/test", tags=["Test"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
