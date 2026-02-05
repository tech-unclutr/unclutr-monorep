from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import shopify_auth, shopify_data
from app.core.limiter import limiter

# Define the sub-application
shopify_app = FastAPI(
    title="Shopify Integration API",
    description="Dedicated API for Shopify Integration",
    version="1.0",
    docs_url="/docs",  # This will be relative to the mount path
    openapi_url="/openapi.json"
)

# Configure Rate Limiting for the sub-app
shopify_app.state.limiter = limiter
shopify_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include Routers
# Note: The mount point in main.py will handle the "/api/v1/integrations/shopify" prefix.
# So we include these routers at the root of *this* sub-app.
from fastapi.middleware.cors import CORSMiddleware

shopify_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Sub-app focuses on data, main app handles restriction if needed, but "*" is safest for mounted apps
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

shopify_app.include_router(shopify_auth.router)
shopify_app.include_router(shopify_data.router)
