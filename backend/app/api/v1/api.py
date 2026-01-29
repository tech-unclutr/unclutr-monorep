from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, onboarding, dev, datasources, metrics, companies, settings, company, users, integrations, analytics, brand, monitoring, intelligence, dashboard

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(dev.router, prefix="/dev", tags=["Dev"])
api_router.include_router(datasources.router, prefix="/datasources", tags=["Datasources"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(company.router, prefix="/company", tags=["Company"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Unified Analytics"])
api_router.include_router(brand.router, prefix="/metrics/brand", tags=["Brand Metrics"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
api_router.include_router(monitoring.router, tags=["Monitoring"])  # Prometheus metrics at /metrics endpoint
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
