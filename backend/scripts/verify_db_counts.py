import asyncio
from sqlmodel import select, func
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.inventory import ShopifyInventoryItem, ShopifyInventoryLevel
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant

async def check_counts():
    async with AsyncSession(engine) as session:
        # Orders
        result = await session.execute(select(func.count(ShopifyOrder.id)))
        orders = result.scalar()
        
        # Products
        result = await session.execute(select(func.count(ShopifyProduct.id)))
        products = result.scalar()
        
        # Variants
        result = await session.execute(select(func.count(ShopifyProductVariant.id)))
        variants = result.scalar()
        
        # Inventory Items
        result = await session.execute(select(func.count(ShopifyInventoryItem.id)))
        items = result.scalar()
        
        # Inventory Levels
        result = await session.execute(select(func.count(ShopifyInventoryLevel.id)))
        levels = result.scalar()
        
        # Customers
        from app.models.shopify.customer import ShopifyCustomer
        result = await session.execute(select(func.count(ShopifyCustomer.id)))
        customers = result.scalar()
        
        # Transactions
        from app.models.shopify.transaction import ShopifyTransaction
        result = await session.execute(select(func.count(ShopifyTransaction.id)))
        transactions = result.scalar()
        
        print(f"ShopifyOrder: {orders}")
        print(f"ShopifyProduct: {products}")
        print(f"ShopifyProductVariant: {variants}")
        print(f"ShopifyInventoryItem: {items}")
        print(f"ShopifyInventoryLevel: {levels}")
        print(f"ShopifyCustomer: {customers}")
        print(f"ShopifyTransaction: {transactions}")

if __name__ == "__main__":
    asyncio.run(check_counts())
