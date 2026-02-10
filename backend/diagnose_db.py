import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.user_queue_item import UserQueueItem
from app.core.config import settings

async def diagnose():
    engine = create_async_engine(str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://"))
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        result = await session.execute(select(UserQueueItem))
        items = result.scalars().all()
        print(f"Total items in UserQueueItem: {len(items)}")
        
        for item in items:
            print(f"Item ID: {item.id}")
            print(f"  Priority: {item.priority_score} (type: {type(item.priority_score)})")
            print(f"  DetectedAt: {item.detected_at} (type: {type(item.detected_at)})")
            print(f"  UpdatedAt: {item.updated_at} (type: {type(item.updated_at)})")
            print(f"  CallHistory: {item.call_history} (type: {type(item.call_history)})")
            
            # Check for sorting crash
            try:
                _ = -item.priority_score
            except Exception as e:
                print(f"  !!! CRASH on -priority_score: {e}")
                
            try:
                _ = item.updated_at > item.updated_at
            except Exception as e:
                print(f"  !!! CRASH on updated_at comparison: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose())
