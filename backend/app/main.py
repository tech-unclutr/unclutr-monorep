import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    
    # Start Background Reconciliation (Layer 2)
    reconciliation_task = asyncio.create_task(run_reconciliation_worker())
    
    yield
    # Shutdown
    reconciliation_task.cancel()
    try:
        await reconciliation_task
    except asyncio.CancelledError:
        pass

async def run_reconciliation_worker():
    """
    Background worker that runs every 6 hours to reconcile all active integrations.
    """
    from app.models.integration import Integration, IntegrationStatus
    from app.services.shopify.tasks import run_shopify_sync_task
    from sqlmodel import select
    from app.core.db import get_session
    
    logger.info("Reconciliation worker started.")
    
    while True:
        try:
            # Wait 6 hours between runs (or 10 mins for initial testing if needed? 
            # In production, 6 hours is set in the plan)
            # For this session, let's stick to 6 hours or 3600*6
            await asyncio.sleep(3600 * 6) 
            
            logger.info("Triggering scheduled reconciliation for all active integrations...")
            
            session_gen = get_session()
            session = await session_gen.__anext__()
            
            stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
            result = await session.execute(stmt)
            active_integrations = result.scalars().all()
            
            for integration in active_integrations:
                # Trigger delta sync in background
                # Note: We don't await the task itself here to allow parallel processing across integrations
                # and to not block the sleeper.
                asyncio.create_task(run_shopify_sync_task(integration.id, delta=True))
                logger.info(f"Scheduled delta sync for integration {integration.id}")
            
            await session.close()
            
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Reconciliation worker loop error: {e}")
            await asyncio.sleep(60) # Fail-safe sleep

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
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

if settings.RATE_LIMIT_ENABLED:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info(f"Rate limiting enabled: {settings.RATE_LIMIT_PER_MINUTE} requests/minute")
else:
    # If disabled, we can either not register or register with no-op.
    # SlowAPI uses decorators, so if enabled is False, we might want to configure limiter to be enabled=False
    limiter.enabled = False
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

if settings.SENTRY_DSN and settings.is_production:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,  # Don't send PII
    )
    logger.info(f"Sentry initialized for environment: {settings.ENVIRONMENT}")
else:
    logger.warning("Sentry disabled (not production) or DSN not configured")


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
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://unwastable-godsent-see.ngrok-free.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Unclutr.ai Backend"}

