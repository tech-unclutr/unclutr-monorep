
import asyncio
from sqlalchemy import select, delete
from app.core.db import get_session
from app.models.integration import Integration
from app.models.datasource import DataSource
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.raw_ingest import ShopifyRawIngest

async def purge_shopify_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    # 1. Get Shopify DataSource
    res = await session.execute(select(DataSource).where(DataSource.slug == "shopify"))
    ds = res.scalars().first()
    
    print(f"DEBUG: DataSource type: {type(ds)}")
    
    if not ds:
        print("Shopify DataSource not found. Nothing to purge.")
        await session.close()
        return

    # 2. Get all Shopify Integrations
    res_int = await session.execute(select(Integration).where(Integration.datasource_id == ds.id))
    integrations = res_int.scalars().all()
    integration_ids = [i.id for i in integrations]
    
    print(f"Found {len(integration_ids)} Shopify integrations to purge.")
    
    if integration_ids:
        # 3. Get all Shopify Order IDs for these integrations
        res_orders = await session.execute(select(ShopifyOrder.id).where(ShopifyOrder.integration_id.in_(integration_ids)))
        order_ids = res_orders.scalars().all()
        
        print(f"Found {len(order_ids)} orders to purge.")
        
        # 4. Delete Line Items
        if order_ids:
            stmt_li = delete(ShopifyLineItem).where(ShopifyLineItem.order_id.in_(order_ids))
            await session.exec(stmt_li)
            print("Deleted ShopifyLineItems.")
            
        # 5. Delete Orders
        stmt_o = delete(ShopifyOrder).where(ShopifyOrder.integration_id.in_(integration_ids))
        await session.exec(stmt_o)
        print("Deleted ShopifyOrders.")

        # 6. Delete Customers
        from app.models.shopify.customer import ShopifyCustomer
        stmt_c = delete(ShopifyCustomer).where(ShopifyCustomer.integration_id.in_(integration_ids))
        await session.exec(stmt_c)
        print("Deleted ShopifyCustomers.")
        
        # 7. Delete Raw Ingest
        stmt_raw = delete(ShopifyRawIngest).where(ShopifyRawIngest.integration_id.in_(integration_ids))
        await session.exec(stmt_raw)
        print("Deleted ShopifyRawIngest records.")
        
        # 8. Delete Integrations
        stmt_del_int = delete(Integration).where(Integration.id.in_(integration_ids))
        await session.exec(stmt_del_int)
        print("Deleted Integration records.")
        
        await session.commit()
        print("Purge successfully committed.")
    else:
        print("No active Shopify integrations to purge.")
        
    await session.close()

if __name__ == "__main__":
    asyncio.run(purge_shopify_data())
