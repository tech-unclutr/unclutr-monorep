
import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.api.v1.endpoints.shopify_data import get_activity_log
from app.models.user import User
from sqlmodel import select
from app.models.integration import Integration
from uuid import UUID

async def test_direct():
    async with AsyncSession(engine) as session:
        integration_id = UUID("66d3876c-b0f4-40b1-a2fc-693533a9a852")
        integration_stmt = select(Integration).where(Integration.id == integration_id)
        integration = (await session.exec(integration_stmt)).first()
        
        user_stmt = select(User).limit(1)
        user = (await session.exec(user_stmt)).first()
        
        if not integration or not user:
            print("Missing integration or user")
            return
            
        print(f"Testing get_activity_log for integration {integration.id}")
        try:
            logs = await get_activity_log(
                integration_id=integration.id,
                session=session,
                current_user=user,
                limit=15
            )
            print(f"SUCCESS! Returned {len(logs)} activity entries.")
            for log in logs[:3]:
                print(f" - {log.emoji} {log.description} ({log.category})")
        except Exception as e:
            print(f"FAILURE: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_direct())
