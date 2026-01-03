from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title="Unclutr.ai API",
    description="""
Backend for Unclutr.ai - The Decision & Control Layer for D2C.

### 🔐 Authorization
To test protected endpoints, click the **Authorize** button:

1. **Development Login**: Use any username and password `admin`.
2. **Email/Password**: Use your real Firebase credentials. (Requires `FIREBASE_API_KEY` in `.env`)
3. **Google Auth**: 
   - Login on the [Frontend](http://localhost:3000).
   - Open DevTools (F12) -> Application -> Local Storage.
   - Look for `firebase:authUser:...`.
   - Copy the `stsTokenManager.accessToken`.
   - Paste it directly into the **Bearer** field in Swagger (click Authorize -> JWT (Bearer)).
""",
    version="v0.1.0",
    lifespan=lifespan
)

from app.api.v1.api import api_router
from app.core.config import settings
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

if settings.RATE_LIMIT_ENABLED:
    limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info(f"Rate limiting enabled: {settings.RATE_LIMIT_PER_MINUTE} requests/minute")
else:
    logger.warning("Rate limiting is DISABLED")

# CORS Configuration
if settings.is_production:
    # Production: Use whitelist
    origins = settings.allowed_origins_list
    logger.info(f"CORS whitelist (production): {origins}")
else:
    # Development: Allow localhost
    # Development: Allow all localhost variants
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    # Regex to match http://localhost:PORT or http://127.0.0.1:PORT
    origin_regex = r"http://(localhost|127\.0\.0\.1)(:\d+)?"
    logger.info("CORS: Allowing localhost regex (development)")
    logger.info("CORS: Allowing localhost (development)")


# (Moved CORSMiddleware to end to ensure it runs first)

# Sentry & Logging Middleware
from app.core.logging_middleware import RequestLoggingMiddleware
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1 if settings.is_production else 1.0,
        send_default_pii=False,  # Don't send PII
    )
    logger.info(f"Sentry initialized for environment: {settings.ENVIRONMENT}")
else:
    logger.warning("Sentry DSN not configured - error monitoring disabled")


from app.middleware.tenant_middleware import TenantMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if settings.is_production:
    app.add_middleware(HTTPSRedirectMiddleware)
    logger.info("HTTPS Enforcement Enabled")

app.add_middleware(TenantMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORSMiddleware must be added LAST to be the OUTERMOST layer (runs first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex if not settings.is_production else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Unclutr.ai Backend"}

