import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.config import settings
from app.models.integration import Integration

async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    async with AsyncSession(engine) as session:
        print("Checking for Shopify integrations...")
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        shop_map = {}
        
        for i in integrations:
            if not i.metadata_info: continue
            shop = i.metadata_info.get("shop")
            if not shop: continue
            
            if shop not in shop_map:
                shop_map[shop] = []
            shop_map[shop].append(i)
            
        for shop, ints in shop_map.items():
            print(f"Shop: {shop} - Count: {len(ints)}")
            for i in ints:
                print(f"  - ID: {i.id} | Status: {i.status} | Updated: {i.updated_at}")
                # Check token snippet (just length to see if present)
                creds = i.credentials or {}
                token = creds.get("access_token")
                print(f"    - Has Token: {bool(token)}")

if __name__ == "__main__":
    asyncio.run(main())
