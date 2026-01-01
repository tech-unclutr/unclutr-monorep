from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import app.models # Ensure all models are registered
import app.core.stamping # Ensure event listeners are registered
import logging

logger = logging.getLogger(__name__)

# Database URL from settings (supports both SQLite and PostgreSQL)
DATABASE_URL = settings.DATABASE_URL

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
    logger.info("Using PostgreSQL with connection pooling")
else:
    logger.warning("Using SQLite - NOT recommended for production!")

engine: AsyncEngine = create_async_engine(DATABASE_URL, **engine_kwargs)

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database initialized")

async def get_session() -> AsyncSession:
    """Dependency for getting async database session"""
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
