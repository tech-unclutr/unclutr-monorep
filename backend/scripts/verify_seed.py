import sys
import os
import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine, init_db
from app.models.datasource import DataSource

async def verify():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        statement = select(DataSource).where(DataSource.is_common == True)
        results = await session.exec(statement)
        commons = results.all()
        
        print("Common Datasources found:", len(commons))
        for c in commons:
            print(f"- {c.name} ({c.category})")

        # Check total count
        all_res = await session.exec(select(DataSource))
        total = len(all_res.all())
        print(f"Total Datasources: {total}")

if __name__ == "__main__":
    asyncio.run(verify())
