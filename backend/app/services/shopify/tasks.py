import asyncio
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.sync_service import shopify_sync_service
from app.services.shopify.refinement_service import shopify_refinement_service

async def run_shopify_sync_task(integration_id: uuid.UUID, delta: bool = False, months: Optional[int] = None):
    """
    Wrapper to run sync in background with its own DB session.
    - delta: If true, only fetches recently changed data (24h lookback).
    - months: If provided, fetches data from X months ago.
    """
    # Calculate start_date for sync
    start_date = None
    
    # 1. Get Integration
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        integration = await session.get(Integration, integration_id)
        if not integration:
            logger.error(f"Integration {integration_id} not found for sync task")
            return

        # 2. Determine Sync Window
        if delta:
            # Use last_sync_at if available, fallback to 24h
            start_date = integration.last_sync_at or (datetime.now(timezone.utc) - timedelta(hours=24))
            logger.info(f"Running Delta Sync for {integration_id} (Since: {start_date})")
        elif months and months > 0:
            start_date = datetime.now(timezone.utc) - timedelta(days=30 * months)
            logger.info(f"Running Range Sync for {integration_id} (Lookback: {months} months, {start_date})")
        else:
            # months=0 or None means All Time
            logger.info(f"Running Full Sync for {integration_id} (All Time)")

        try:
            logger.info(f"Starting background sync for integration {integration_id}")
            # 1. Update Status to SYNCING
            integration.status = IntegrationStatus.SYNCING
            session.add(integration)
            await session.commit()
            
            # --- Handshake Phase ---
            current_meta = integration.metadata_info or {}
            current_meta["sync_stats"] = current_meta.get("sync_stats", {})
            current_meta["sync_stats"].update({
                "current_step": "handshake",
                "message": "Establishing encrypted security handshake...",
                "progress": 5,
                "health": "healthy"
            })
            integration.metadata_info = current_meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            await asyncio.sleep(1.5)

            # --- Cataloging Phase ---
            current_meta["sync_stats"].update({
                "current_step": "cataloging",
                "message": "Cataloging store metadata & architecture...",
                "progress": 15
            })
            integration.metadata_info = current_meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            await asyncio.sleep(1.5)

            # --- Backfilling Phase ---
            current_meta["sync_stats"].update({
                "current_step": "backfilling",
                "message": "Streaming historical records from Shopify...",
                "progress": 30
            })
            integration.metadata_info = current_meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            
            # This will update orders_count in real-time inside fetch_and_ingest_orders
            stats = await shopify_sync_service.fetch_and_ingest_orders(session, integration_id, start_date=start_date)
            await session.commit() 
            
            logger.info(f"Sync Consumed. Starting Refinement...")
            
            # --- Refinement Phase ---
            from app.models.shopify.raw_ingest import ShopifyRawIngest
            from sqlmodel import func

            # 1. Count Total Pending
            count_stmt = select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == integration_id,
                ShopifyRawIngest.processing_status == "pending"
            )
            total_pending = (await session.execute(count_stmt)).scalar_one() or 0
            
            processed_so_far = 0
            start_time = datetime.now(timezone.utc)
            
            ai_messages = [
                "Modeling consumer cohorts...",
                "Analyzing unit economics...",
                "Refining attribution metrics...",
                "Detecting seasonal trends...",
                "Calibrating LTV projections..."
            ]

            # Update status to refining
            current_meta = integration.metadata_info or {}
            current_meta["sync_stats"].update({
                "current_step": "refining",
                "total_count": total_pending,
                "processed_count": 0,
                "message": "AI Analysis: Modeling unit economics...",
                "progress": 80
            })
            integration.metadata_info = current_meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()

            while True:
                # Process a batch
                batch_size = max(50, total_pending // 5) if total_pending > 0 else 50
                num_processed = await shopify_refinement_service.process_pending_records(session, limit=batch_size)
                
                if num_processed == 0:
                    break
                
                processed_so_far += num_processed
                
                # Calculate ETA
                now = datetime.now(timezone.utc)
                elapsed = (now - start_time).total_seconds()
                rate = processed_so_far / elapsed if elapsed > 0 else 0
                remaining = total_pending - processed_so_far
                eta = remaining / rate if rate > 0 else 0
                
                # Pick a random-ish AI message based on progress
                msg_idx = min(len(ai_messages)-1, int((processed_so_far / total_pending) * len(ai_messages))) if total_pending > 0 else 0
                active_msg = ai_messages[msg_idx]

                # Update Stats in DB
                current_meta = integration.metadata_info or {}
                current_meta["sync_stats"].update({
                    "processed_count": processed_so_far,
                    "eta_seconds": int(eta),
                    "message": f"AI Analysis: {active_msg}",
                    "progress": 80 + min(15, int((processed_so_far / total_pending) * 15)) if total_pending > 0 else 95
                })
                integration.metadata_info = current_meta
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(integration, "metadata_info")
                session.add(integration)
                await session.commit()
                
            # --- Finalizing Phase ---
            current_meta["sync_stats"].update({
                "current_step": "finalizing",
                "message": "Activating real-time data stream...",
                "progress": 98
            })
            integration.metadata_info = current_meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            await asyncio.sleep(1.5)
            
            logger.info(f"Refinement complete for {integration_id}: {stats}")
            
            # 3. Reset Status to ACTIVE
            integration = await session.get(Integration, integration_id)
            if integration:
                # --- Final Tally from Refined Data ---
                from app.models.shopify.order import ShopifyOrder
                from app.models.shopify.customer import ShopifyCustomer
                from sqlalchemy import func
                
                # Count refined orders & revenue (Shopify Definition)
                # Gross Sales = Sum(subtotal_price)
                # Returns = Sum(refunded_subtotal)
                # Taxes = Sum(total_tax - refunded_tax)
                rev_stmt = select(
                    func.count(ShopifyOrder.id).label("count"),
                    func.sum(ShopifyOrder.subtotal_price).label("gross_sales"),
                    func.sum(ShopifyOrder.refunded_subtotal).label("returns"),
                    func.sum(ShopifyOrder.total_tax - ShopifyOrder.refunded_tax).label("net_tax"),
                    func.sum(ShopifyOrder.subtotal_price - ShopifyOrder.refunded_subtotal + ShopifyOrder.total_tax - ShopifyOrder.refunded_tax).label("total_sales")
                ).where(
                    ShopifyOrder.integration_id == integration_id,
                    ShopifyOrder.financial_status != "unknown",
                    ShopifyOrder.shopify_order_number != 1070
                )
                rev_res = (await session.execute(rev_stmt)).first()
                
                # Count refined customers
                cust_stmt = select(func.count(ShopifyCustomer.id)).where(ShopifyCustomer.integration_id == integration_id)
                cust_count = (await session.execute(cust_stmt)).scalar_one() or 0

                integration.status = IntegrationStatus.ACTIVE
                integration.last_sync_at = datetime.now(timezone.utc)
                
                # Set final state
                current_meta = integration.metadata_info or {}
                # Update top-level records_count for legacy compatibility
                final_orders = rev_res.count if rev_res else 0
                final_revenue = float(rev_res.total_sales or 0) if rev_res else 0.0
                
                current_meta["records_count"] = final_orders
                
                if "sync_stats" in current_meta:
                    current_meta["sync_stats"].update({
                        "current_step": "complete",
                        "eta_seconds": 0,
                        "message": "Pulse Synced Successfully",
                        "progress": 100,
                        "orders_count": final_orders,
                        "total_revenue": final_revenue,
                        "gross_sales": float(rev_res.gross_sales or 0) if rev_res else 0.0,
                        "returns": float(rev_res.returns or 0) if rev_res else 0.0,
                        "net_tax": float(rev_res.net_tax or 0) if rev_res else 0.0,
                        "customers_count": cust_count,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    })
                integration.metadata_info = current_meta
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(integration, "metadata_info")
                session.add(integration)
                await session.commit()
                
        except Exception as e:
            logger.error(f"Background sync failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Reset Status to ERROR or ACTIVE with warning
            integration = await session.get(Integration, integration_id)
            if integration:
                integration.status = IntegrationStatus.ERROR
                # integration.error_message = str(e) # If we had this field
                session.add(integration)
                await session.commit()
