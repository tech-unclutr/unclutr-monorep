
import asyncio
from sqlmodel import select, func
from app.api.deps import get_db_session
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.product import ShopifyProduct
from app.models.shopify.inventory import ShopifyInventoryLevel
from app.core.db import async_session_factory

async def main():
    async with async_session_factory() as session:
        print("Checking Database Counts...")
        
        orders_count = (await session.execute(select(func.count(ShopifyOrder.id)))).scalar_one()
        products_count = (await session.execute(select(func.count(ShopifyProduct.id)))).scalar_one()
        inventory_count = (await session.execute(select(func.count(ShopifyInventoryLevel.id)))).scalar_one()
        
        print(f"Orders: {orders_count}")
        print(f"Products: {products_count}")
        print(f"Inventory Levels: {inventory_count}")

if __name__ == "__main__":
    asyncio.run(main())
