
import asyncio
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus

async def main():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        stmt = select(Integration).where(Integration.status == IntegrationStatus.SYNCING)
        results = await session.execute(stmt)
        integrations = results.scalars().all()
        
        print(f"Found {len(integrations)} stuck integrations.")
        
        for integration in integrations:
            print(f"Resetting integration {integration.id} (Company: {integration.company_id})")
            integration.status = IntegrationStatus.ACTIVE # Or ERROR? Let's default to ACTIVE so user can try again freely
            session.add(integration)
            
        await session.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
