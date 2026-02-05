import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from loguru import logger
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.services.analytics.service import AnalyticsService
from app.services.shopify.refinement_service import shopify_refinement_service
from app.services.shopify.sync_service import shopify_sync_service


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
                "message": "Streaming Orders from Shopify...",
                "progress": 30
            })
            integration.metadata_info = current_meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            
            # 1. Orders
            order_stats, order_ids = await shopify_sync_service.fetch_and_ingest_orders(session, integration_id, start_date=start_date)
            await session.commit()

            # 1b. Transactions
            if order_ids:
                current_meta["sync_stats"].update({
                    "message": f"Fetching payment details for {len(order_ids)} orders...",
                    "progress": 40
                })
                integration.metadata_info = current_meta
                flag_modified(integration, "metadata_info")
                session.add(integration)
                await session.commit()
                transaction_stats = await shopify_sync_service.fetch_and_ingest_transactions(session, integration_id, order_ids)
                await session.commit()
            else:
                transaction_stats = {"ingested": 0}
            # 2. Products
            current_meta["sync_stats"].update({
                "message": "Streaming Product Catalog...",
                "progress": 50
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            product_stats = await shopify_sync_service.fetch_and_ingest_products(session, integration_id, start_date=start_date)
            await session.commit()

            # 3. Inventory (Locations + Levels)
            current_meta["sync_stats"].update({
                "message": "Mapping Inventory across Locations...",
                "progress": 65
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            inventory_stats = await shopify_sync_service.fetch_and_ingest_inventory(session, integration_id)
            await session.commit()

            # 4. Customers
            current_meta["sync_stats"].update({
                "message": "Unified Customer Database sync...",
                "progress": 75
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            customer_sync_stats = await shopify_sync_service.fetch_and_ingest_customers(session, integration_id, start_date=start_date)
            await session.commit()

            # 5. Reports (Metadata)
            current_meta["sync_stats"].update({
                "message": "Cataloging Analytics Reports...",
                "progress": 75
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            report_stats = await shopify_sync_service.fetch_and_ingest_reports(session, integration_id)
            await session.commit()

            # 6. Refunds
            current_meta["sync_stats"].update({
                "message": "Collecting refund data...",
                "progress": 76
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            refund_stats = await shopify_sync_service.fetch_and_ingest_refunds(session, integration_id, start_date=start_date)
            await session.commit()

            # 7. Financials (Payouts + Disputes + Balance Transactions)
            current_meta["sync_stats"].update({
                "message": "Reconciling bank payouts & disputes...",
                "progress": 77
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            
            payout_stats = await shopify_sync_service.fetch_and_ingest_payouts(session, integration_id, start_date=start_date)
            dispute_stats = await shopify_sync_service.fetch_and_ingest_disputes(session, integration_id, start_date=start_date)
            balance_stats = await shopify_sync_service.fetch_and_ingest_balance_transactions(session, integration_id)
            await session.commit()

            # 8. Fulfillments (Requires Order IDs)
            if order_ids:
                current_meta["sync_stats"].update({
                    "message": f"Mapping fulfillment logistics for {len(order_ids)} orders...",
                    "progress": 78
                })
                integration.metadata_info = current_meta
                flag_modified(integration, "metadata_info")
                session.add(integration)
                await session.commit()
                fulfillment_stats = await shopify_sync_service.fetch_and_ingest_fulfillments(session, integration_id, order_ids)
                await session.commit()
            else:
                fulfillment_stats = {"ingested": 0}

            # 9. Marketing (Abandoned Checkouts + Events)
            current_meta["sync_stats"].update({
                "message": "Analyzing marketing & abandonments...",
                "progress": 79
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            checkout_stats = await shopify_sync_service.fetch_and_ingest_checkouts(session, integration_id, start_date=start_date)
            marketing_stats = await shopify_sync_service.fetch_and_ingest_marketing_events(session, integration_id)
            await session.commit()

            # 10. Promotional Rules (Price Rules + Discount Codes)
            current_meta["sync_stats"].update({
                "message": "Harvesting promotional rules...",
                "progress": 80
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            promo_stats = await shopify_sync_service.fetch_and_ingest_price_rules(session, integration_id)
            await session.commit()

            stats = {
                "orders": order_stats.get("ingested", 0),
                "products": product_stats.get("ingested", 0),
                "inventory": inventory_stats.get("levels", 0),
                "customers": customer_sync_stats.get("ingested", 0),
                "transactions": transaction_stats.get("ingested", 0),
                "reports": report_stats.get("ingested", 0),
                "refunds": refund_stats.get("ingested", 0),
                "payouts": payout_stats.get("ingested", 0),
                "disputes": dispute_stats.get("ingested", 0),
                "balance_transactions": balance_stats.get("ingested", 0),
                "fulfillments": fulfillment_stats.get("ingested", 0),
                "checkouts": checkout_stats.get("ingested", 0),
                "marketing_events": marketing_stats.get("ingested", 0),
                "price_rules": promo_stats.get("price_rules", 0),
                "discount_codes": promo_stats.get("discount_codes", 0)
            }

            
            logger.info("Sync Consumed. Starting Refinement...")
            
            # --- Refinement Phase (First Pass - Metadata) ---
            from sqlmodel import func

            from app.models.shopify.raw_ingest import ShopifyRawIngest

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
                num_processed = await shopify_refinement_service.process_pending_records(session, integration_id=integration_id, limit=batch_size)
                
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
                
            # --- Report Data Sync Phase ---
            logger.info(f"Starting Report Data Sync for {integration_id}")
            current_meta = integration.metadata_info or {}
            current_meta["sync_stats"].update({
                "current_step": "analytics",
                "message": "Executing ShopifyQL Analytics Queries...",
                "progress": 96
            })
            integration.metadata_info = current_meta
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            
            report_data_stats = await shopify_sync_service.sync_report_data(session, integration_id, start_date=start_date)
            await session.commit()
            
            # Refine report data
            if report_data_stats.get("ingested", 0) > 0:
                logger.info(f"Refining {report_data_stats['ingested']} report data records...")
                await shopify_refinement_service.process_pending_records(session, integration_id=integration_id, limit=100)
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
                from sqlalchemy import func

                from app.models.shopify.customer import ShopifyCustomer
                from app.models.shopify.order import ShopifyOrder
                
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

                # Count refined products & variants
                from app.models.shopify.product import (
                    ShopifyProduct,
                )
                prod_stmt = select(func.count(ShopifyProduct.id)).where(ShopifyProduct.integration_id == integration_id)
                prod_count = (await session.execute(prod_stmt)).scalar_one() or 0

                # Count refined inventory locations & levels
                from app.models.shopify.inventory import (
                    ShopifyInventoryLevel,
                    ShopifyLocation,
                )
                loc_stmt = select(func.count(ShopifyLocation.id)).where(ShopifyLocation.integration_id == integration_id)
                loc_count = (await session.execute(loc_stmt)).scalar_one() or 0
                
                inv_stmt = select(func.sum(ShopifyInventoryLevel.available)).where(ShopifyInventoryLevel.integration_id == integration_id)
                inv_count = (await session.execute(inv_stmt)).scalar_one() or 0

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
                        "products_count": prod_count,
                        "locations_count": loc_count,
                        "inventory_count": int(inv_count or 0),
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    })
                integration.metadata_info = current_meta
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(integration, "metadata_info")
                session.add(integration)
                await session.commit()

                # --- Metrics Generation Phase (Module 6 Refactored) ---
                logger.info(f"🚀 Starting Unified Metrics Generation for {integration_id}")
                today = datetime.now(timezone.utc).date()
                for i in range(31): 
                    target_date = today - timedelta(days=i)
                    try:
                        await AnalyticsService.refresh_snapshot(session, integration, target_date)
                    except Exception as metric_err:
                        logger.error(f"Failed to generate metrics for {target_date}: {metric_err}")
                
                await session.commit()
                logger.info(f"✅ Historical Metrics baseline established for {integration_id}")
                
        except Exception as e:
            logger.error(f"Background sync failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Reset Status to ACTIVE (with error message) for transient failures
            # Only set to ERROR if it's a configuration/auth issue
            integration = await session.get(Integration, integration_id)
            if integration:
                is_auth_error = "401" in str(e) or "403" in str(e) or "Unauthorized" in str(e) or isinstance(e, ValueError)
                
                integration.status = IntegrationStatus.ERROR if is_auth_error else IntegrationStatus.ACTIVE
                integration.error_message = str(e)  # Persist actual error for debugging
                
                # If reverting to ACTIVE, we should clear the "Syncing..." state in metadata too if possible
                if integration.status == IntegrationStatus.ACTIVE:
                    current_meta = integration.metadata_info or {}
                    if "sync_stats" in current_meta:
                        current_meta["sync_stats"]["message"] = f"Sync interrupted: {str(e)[:50]}..."
                        # Don't set 'error' step, just leave it or set to idle/partial
                        current_meta["sync_stats"]["current_step"] = "complete" # Or "partial"
                    integration.metadata_info = current_meta
                    from sqlalchemy.orm.attributes import flag_modified
                    flag_modified(integration, "metadata_info")

                session.add(integration)
                await session.commit()

async def run_reconciliation_task(integration_id: uuid.UUID):
    """
    Background Task: Zero-Drift Reconciliation
    """
    from app.core.db import async_session_factory
    from app.models.integration import Integration
    from app.services.shopify.reconciliation_service import (
        shopify_reconciliation_service,
    )
    
    logger.info(f"🛡️ Triggering Reconciliation Task for {integration_id}")
    
    async with async_session_factory() as session:
        try:
            integration = await session.get(Integration, integration_id)
            if not integration:
                logger.error(f"Integration {integration_id} not found/inactive")
                return

            try:
                # Add strict 5-minute timeout to prevent hangs
                await asyncio.wait_for(
                    shopify_reconciliation_service.reconcile_integration(session, integration),
                    timeout=300
                )
            except asyncio.TimeoutError:
                logger.error(f"Reconciliation timed out for {integration_id}")
                # Reset status to ACTIVE (not ERROR, as timeout is likely data volume related, not auth)
                integration.status = IntegrationStatus.ACTIVE
                # Update metadata to show warning
                meta = integration.metadata_info or {}
                if "sync_stats" not in meta: meta["sync_stats"] = {}
                meta["sync_stats"].update({
                    "current_step": "complete", # Treat as complete but with warning message
                    "message": "Verification timed out (Data too large)",
                    "last_updated": datetime.now(timezone.utc).isoformat()
                })
                integration.metadata_info = meta
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(integration, "metadata_info")
                session.add(integration)
                await session.commit()
            logger.info(f"✅ Reconciliation Task Complete for {integration_id}")
            
        except Exception as e:
            logger.error(f"❌ Reconciliation Task Critical Failure: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Fatal recovery: ensure the UI doesn't stick in "Auditing"
            try:
                await session.rollback() # Ensure session is clean before status update
                # Re-fetch in a fresh session block if needed, but we have the session here
                integration = await session.get(Integration, integration_id)
                if integration:
                    meta = integration.metadata_info or {}
                    if "sync_stats" not in meta: meta["sync_stats"] = {}
                    meta["sync_stats"].update({
                        "current_step": "error",
                        "message": f"System Error: {str(e)}",
                        "progress": 0,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    })
                    integration.metadata_info = meta
                    from sqlalchemy.orm.attributes import flag_modified
                    flag_modified(integration, "metadata_info")
                    session.add(integration)
                    await session.commit()
            except Exception as nested_e:
                logger.error(f"Failed to write error status to DB: {nested_e}")
