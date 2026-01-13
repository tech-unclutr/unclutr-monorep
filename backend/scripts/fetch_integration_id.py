
import asyncio
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration

async def main():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        result = await session.execute(select(Integration))
        integration = result.scalars().first()
        if integration:
            print(integration.id)
        else:
            print("None")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ImportError:
        # Fallback if path issues (simplistic)
        pass
