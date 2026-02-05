
import asyncio
import sys
import os
from uuid import UUID

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session
from app.services.intelligence.campaign_service import campaign_service

async def reproduce_delete():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    campaign_id = UUID("04d9d8bc-a10d-41f5-b635-981faef30e53")
    company_id = UUID("a953f1d7-f0a8-49b3-a6f4-c9fbcf774b48")
    
    print(f"Reproducing delete for Campaign: {campaign_id}")
    try:
        success = await campaign_service.delete_campaign(session, campaign_id, company_id)
        print(f"Delete returned: {success}")
    except Exception as e:
        import traceback
        print(f"Caught Exception: {e}")
        traceback.print_exc()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reproduce_delete())
