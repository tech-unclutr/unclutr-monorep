import asyncio
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.integration import Integration, IntegrationStatus

async def activate_test_integration():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_factory() as session:
        res = await session.execute(select(Integration).where(Integration.metadata_info["shop"].astext == "unclutr-dev.myshopify.com"))
        row = res.scalars().first()
        if row:
            row.status = IntegrationStatus.ACTIVE
            session.add(row)
            await session.commit()
            print("✅ Integration 'unclutr-dev.myshopify.com' is now ACTIVE.")
        else:
            print("❌ Target integration not found.")

if __name__ == "__main__":
    asyncio.run(activate_test_integration())
