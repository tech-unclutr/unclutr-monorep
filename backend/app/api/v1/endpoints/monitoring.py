"""
Metrics API endpoint for Prometheus scraping.
"""
from fastapi import APIRouter, Response

from prometheus_client import CONTENT_TYPE_LATEST
from app.core.metrics import get_metrics

router = APIRouter()

@router.get("/metrics")
async def prometheus_metrics():
    """
    Prometheus metrics endpoint.
    Returns metrics in Prometheus text format.
    """
    metrics = get_metrics()
    return Response(content=metrics, media_type=CONTENT_TYPE_LATEST)

@router.get("/health/intelligence")
async def intelligence_health():
    """
    Health check for Intelligence Engine.
    Returns status and feature flag state.
    """
    from app.core.feature_flags import feature_flags
    
    return {
        "status": "healthy",
        "intelligence_enabled": feature_flags.is_intelligence_enabled(),
        "min_velocity_days": feature_flags.get_min_velocity_days(),
        "velocity_threshold": feature_flags.get_velocity_threshold(),
        "cache_ttl_seconds": feature_flags.get_cache_ttl_seconds()
    }
