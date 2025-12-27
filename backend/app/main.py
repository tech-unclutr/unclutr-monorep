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

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

@app.middleware("http")
async def debug_auth_header(request: Request, call_next):
    auth = request.headers.get("Authorization")
    print(f"DEBUG MIDDLEWARE: URL={request.url} Auth={auth[:50] if auth else 'NONE'}...")
    response = await call_next(request)
    return response

# (Moved CORSMiddleware to end to ensure it runs first)

# Sentry & Logging Middleware
from app.core.logging_middleware import RequestLoggingMiddleware
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)

from app.middleware.tenant_middleware import TenantMiddleware
app.add_middleware(TenantMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORSMiddleware must be added LAST to be the OUTERMOST layer (runs first)
# This ensures even 401s/Errors from other middleware get CORS headers.
app.add_middleware(
    CORSMiddleware,
    # Use Regex for maximum compatibility during dev
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Unclutr.ai Backend"}

