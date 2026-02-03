import asyncio
import sys
import os
from uuid import UUID

# Add backend to sys.path
sys.path.append("/Users/param/Documents/Unclutr/backend")

from app.core.db import async_session_factory
from app.api.v1.endpoints.execution import get_campaign_call_logs
from app.models.user import User

async def main():
    campaign_id = UUID("7b277bac-9157-4c01-9b6e-3b28b088e0b4") # From user error
    
    print(f"Testing /logs for campaign {campaign_id}")
    
    async with async_session_factory() as session:
        try:
            # Mock user (not used in query logic really, just dependency)
            mock_user = User(id=UUID("00000000-0000-0000-0000-000000000000"), email="test@test.com")
            
            logs = await get_campaign_call_logs(
                campaign_id=campaign_id,
                page=1,
                page_size=20,
                session=session,
                current_user=mock_user
            )
            print("Success!")
            print(f"Retrieved {len(logs)} logs")
            # print(logs[0] if logs else "No logs")
        except Exception as e:
            print("Crashed!")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
