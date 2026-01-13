import asyncio
from sqlmodel import select
from app.models.integration import Integration
from app.core.db import engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.shopify.sync_service import shopify_sync_service
from loguru import logger

async def trigger_sync():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Get all Shopify integrations
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        logger.info(f"Found {len(integrations)} integrations.")
        
        for integration in integrations:
            if not integration.metadata_info or not integration.metadata_info.get("shop"):
                continue
                
            shop = integration.metadata_info.get("shop")
            logger.info(f"Syncing stats for {shop}...")
            
            try:
                # This will backfill orders, products, and inventory
                logger.info(f"--- Syncing Orders ---")
                order_stats, order_ids = await shopify_sync_service.fetch_and_ingest_orders(session, integration.id)
                logger.info(f"Orders: {order_stats}")

                logger.info(f"--- Syncing Transactions for {len(order_ids)} orders ---")
                txn_stats = await shopify_sync_service.fetch_and_ingest_transactions(session, integration.id, order_ids)
                logger.info(f"Transactions: {txn_stats}")

                logger.info(f"--- Syncing Products ---")
                product_stats = await shopify_sync_service.fetch_and_ingest_products(session, integration.id)
                logger.info(f"Products: {product_stats}")

                logger.info(f"--- Syncing Inventory (Locations + Levels + Items) ---")
                inv_stats = await shopify_sync_service.fetch_and_ingest_inventory(session, integration.id)
                logger.info(f"Inventory: {inv_stats}")

                logger.info(f"--- Syncing Customers ---")
                cust_stats = await shopify_sync_service.fetch_and_ingest_customers(session, integration.id)
                logger.info(f"Customers: {cust_stats}")
                
                await session.commit()
                
                # Trigger Refinement
                logger.info(f"--- Refining Data ---")
                from app.services.shopify.refinement_service import shopify_refinement_service
                while True:
                    processed = await shopify_refinement_service.process_pending_records(session, limit=100)
                    logger.info(f"Refined {processed} records...")
                    if processed == 0:
                        break
                
                logger.info(f"Sync & Refinement complete for {shop}")
            except Exception as e:
                logger.error(f"Sync failed for {shop}: {e}")

if __name__ == "__main__":
    asyncio.run(trigger_sync())
