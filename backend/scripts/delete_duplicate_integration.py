
import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.integration import Integration

async def main():
    async with async_session_factory() as session:
        print("Deleting duplicate integration...")
        # ID identified from previous inspection: a0dbdb71-a318-44e3-8439-b28bdbd6470a
        duplicate_id = UUID('a0dbdb71-a318-44e3-8439-b28bdbd6470a')
        
        integ = await session.get(Integration, duplicate_id)
        if integ:
            await session.delete(integ)
            await session.commit()
            print(f"Deleted duplicate integration {duplicate_id}")
        else:
            print("Integration not found.")

if __name__ == "__main__":
    asyncio.run(main())
