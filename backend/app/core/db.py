import logging

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

logger = logging.getLogger(__name__)

# Database URL from settings (supports both SQLite and PostgreSQL)
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")

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
        "connect_args": {
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }, # Required for Supabase Transaction Pooler
    })
    logger.info("Using PostgreSQL with connection pooling")
else:
    logger.warning("Using SQLite - NOT recommended for production!")

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
