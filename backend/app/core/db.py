import logging

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

logger = logging.getLogger(__name__)

from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

# Database URL from settings (supports both SQLite and PostgreSQL)
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if "postgresql+asyncpg" in DATABASE_URL:
    # Robustly handle sslmode which asyncpg doesn't support directly in the URL
    parsed_url = urlparse(DATABASE_URL)
    query_params = parse_qs(parsed_url.query)
    
    # Check if we are using Unix sockets (Cloud SQL on Cloud Run)
    is_unix_socket = "/cloudsql/" in DATABASE_URL or parsed_url.path.startswith("/") and not parsed_url.netloc
    
    # If sslmode is present, handle it
    if "sslmode" in query_params:
        sslmode = query_params.pop("sslmode")[0]
        # Only add SSL if not using unix sockets (SSL is redundant and often causes 
        # connection refused on unix sockets)
        if sslmode == "require" and not is_unix_socket:
            query_params["ssl"] = ["require"]
    
    # Explicitly ensure ssl is False for unix sockets if not otherwise specified
    if is_unix_socket and "ssl" not in query_params:
        query_params["ssl"] = ["disable"]
    
    if is_unix_socket:
         logger.info("Detected Unix socket connection.")

    # Reconstruct URL without problematic arguments
    new_query = urlencode(query_params, doseq=True)
    DATABASE_URL = urlunparse(parsed_url._replace(query=new_query))

# Engine configuration
engine_kwargs = {
    "echo": not settings.is_production,  # Disable SQL logging in production
    "future": True,
}

# Add PostgreSQL-specific configuration
if DATABASE_URL.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": 10,  # Connection pool size
        "max_overflow": 20,  # Max connections beyond pool_size
        "pool_pre_ping": True,  # Verify connections before using
        "pool_recycle": 3600,  # Recycle connections after 1 hour
    })

    # Explicitly enforce Unix socket usage if detected in URL
    # This fixes issues where generic host (like localhost) causes asyncpg to attempt TCP
    # Explicitly enforce Unix socket usage if detected in URL
    # This fixes issues where generic host (like localhost) causes asyncpg to attempt TCP
    if "/cloudsql/" in DATABASE_URL or "%2Fcloudsql%2F" in DATABASE_URL:
        # Check for host in query params (decoded)
        parsed_current = urlparse(DATABASE_URL)
        qs_current = parse_qs(parsed_current.query)
        
        if "host" in qs_current:
             if "connect_args" not in engine_kwargs:
                 engine_kwargs["connect_args"] = {}
             engine_kwargs["connect_args"]["host"] = qs_current["host"][0]
             # Also disable SSL for Unix sockets to prevent timeouts
             engine_kwargs["connect_args"]["ssl"] = False
             logger.info("Using Unix socket from query param. SSL disabled.")

        # Check for host in netloc (encoded)
        elif "%2Fcloudsql%2F" in DATABASE_URL and not parsed_current.netloc.endswith("localhost"):
             # If host is in netloc, SQLAlchemy handles parsing, but we must forcibly disable SSL
             engine_kwargs["connect_args"]["ssl"] = False
             logger.info("Using Unix socket from netloc. SSL disabled.")

    logger.info("Using PostgreSQL with connection pooling")
else:
    logger.warning("Using SQLite - NOT recommended for production!")

if not DATABASE_URL:
    logger.warning("DATABASE_URL is missing! Using cached SQLite for build/startup safety.")
    DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine: AsyncEngine = create_async_engine(DATABASE_URL, **engine_kwargs)

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    """Initialize database tables and repair constraints"""
    async with engine.begin() as conn:
        # Tables should be created via Alembic migrations, not automatically.
        await conn.run_sync(SQLModel.metadata.create_all)
        pass
    
    # Automated healing of integration constraints (Once For All fix)
    from app.core.db_repair import heal_integration_constraints
    await heal_integration_constraints(engine)
    
    logger.info("Database initialized and healed")

async def get_session() -> AsyncSession:
    """Dependency for getting async database session"""
    async with async_session_factory() as session:
        yield session
