import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlmodel import select, func
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.user_queue_item import UserQueueItem

async def check_queue_status():
    async with async_session_factory() as session:
        # Check QueueItem statuses
        print("\n=== QueueItem Status Distribution ===")
        result = await session.execute(
            select(QueueItem.status, func.count(QueueItem.id))
            .group_by(QueueItem.status)
        )
        for status, count in result.all():
            print(f"{status}: {count}")
        
        # Check UserQueueItem statuses
        print("\n=== UserQueueItem Status Distribution ===")
        result = await session.execute(
            select(UserQueueItem.status, func.count(UserQueueItem.id))
            .group_by(UserQueueItem.status)
        )
        user_queue_items = result.all()
        if user_queue_items:
            for status, count in user_queue_items:
                print(f"{status}: {count}")
        else:
            print("(empty)")
        
        # Check total counts
        total_queue = await session.execute(select(func.count(QueueItem.id)))
        total_user_queue = await session.execute(select(func.count(UserQueueItem.id)))
        
        print(f"\nTotal QueueItems: {total_queue.scalar()}")
        print(f"Total UserQueueItems: {total_user_queue.scalar()}")

if __name__ == "__main__":
    asyncio.run(check_queue_status())
