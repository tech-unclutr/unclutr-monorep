try:
    import asyncio
    import sys
    import os
    # Add app to path if needed (usually current dir is fine if run from backend)
    sys.path.append(os.getcwd())
    
    from app.core.db import async_session_factory
    from app.api.v1.endpoints.shopify_data import get_activity_log
    from app.models.integration import Integration
    from sqlmodel import select
    print("Imports success")
    
    async def verify():
        async with async_session_factory() as session:
            res = await session.execute(select(Integration).limit(1))
            integration = res.scalar_one()
            print(f"Integration ID: {integration.id}")
            
            activity = await get_activity_log(
                integration_id=integration.id,
                limit=15,
                current_user=None, 
                session=session
            )
            print(f"Results: {len(activity)}")
            for act in activity:
                print(f" - {act['emoji']} {act['event']}")
                
    asyncio.run(verify())
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
