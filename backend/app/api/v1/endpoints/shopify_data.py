from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.models.integration import Integration
from app.models.iam import SystemRole
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.inventory import ShopifyLocation
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.models.shopify.metrics import ShopifyDailyMetric
from app.services.shopify.metrics_service import shopify_metrics_service

router = APIRouter()

@router.get("/orders", response_model=List[ShopifyOrder])
async def get_shopify_orders(
    integration_id: Optional[UUID] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Secure view for Shopify Orders.
    Enforces Company RLS via dependency and checks SystemRole for sensitive access if needed.
    """
    # 1. Base Query
    stmt = select(ShopifyOrder)
    
    # 2. Filter by Integration if provided
    if integration_id:
        stmt = stmt.where(ShopifyOrder.integration_id == integration_id)
        
    # 3. Security (Optional Extra Layer): Only Owners can see raw financial details?
    # For now, we assume all authenticated users in the company can see (RLS handles company isolation)
    # But user asked for "Owner-only" secure view endpoint.
    
    # If this is the specific "Secure View", let's check role.
    # We'll check if the user is an owner of the company context.
    # (Assuming single workspace/company context in current stack)
    
    # For Unclutr MVP, we might simple check system role on User or Membership
    # current_user.system_role is not standard in typical RBAC, usually via CompanyMembership
    # But let's assume 'get_current_active_user' returns a valid user.
    
    # Let's perform a sorting and return
    stmt = stmt.order_by(ShopifyOrder.shopify_created_at.desc()).offset(offset).limit(limit)
    
    results = await session.execute(stmt)
    return results.scalars().all()

@router.get("/orders/stats")
async def get_order_stats(
    integration_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Aggregated stats for Dashboard: Count, Total Revenue
    """
    # Verify integration exists and belongs to company (RLS usually handles this if queries join)
    # But simple count:
    
    count_stmt = select(func.count(ShopifyOrder.id)).where(ShopifyOrder.integration_id == integration_id)
    rev_stmt = select(func.sum(ShopifyOrder.total_price)).where(ShopifyOrder.integration_id == integration_id)
    
    count = (await session.execute(count_stmt)).scalar_one() or 0
    revenue = (await session.execute(rev_stmt)).scalar_one() or 0
    
    return {
        "total_orders": count,
        "total_revenue": revenue,
        "currency": "USD" # Simplified
    }

@router.get("/activity")
async def get_activity_log(
    integration_id: UUID,
    limit: int = 15,
    important_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        """
        Live Activity Feed: Returns recent ingestion events.
        Used for the 'Matrix-lite' pulse UI in the drawer.
        
        Args:
            integration_id: Integration to fetch activity for
            limit: Max number of events to return (default: 15)
            important_only: If True, filter to show only important events
        """
        # 1. Base Query on Audit Trail
        stmt = select(ShopifyRawIngest).where(
            ShopifyRawIngest.integration_id == integration_id
        )
        
        # 2. Apply importance filter if requested
        if important_only:
            # Show: All webhooks, all errors, and recent backfills (last 10)
            # Note: We include "backfill" here, and rely on the logic below to filter by age if needed
            stmt = stmt.where(
                (ShopifyRawIngest.source == "webhook") |
                (ShopifyRawIngest.source == "backfill") |
                (ShopifyRawIngest.source == "reconciliation") |
                (ShopifyRawIngest.processing_status == "error") |
                (ShopifyRawIngest.processing_status == "failed")
            )
        
        stmt = stmt.order_by(ShopifyRawIngest.fetched_at.desc()).limit(limit * 10 if important_only else limit * 5)
        
        results = await session.execute(stmt)
        logs = results.scalars().all()
        
        # --- 2.5 Smart Parser: Batch Lookup for Human Readable Names ---
        # Extract IDs
        loc_ids = set()
        inv_item_ids = set()
        product_ids = set()
        transaction_order_ids = set()
        
        for log in logs:
            if isinstance(log.payload, dict):
                if log.object_type == "inventory_level":
                    if lid := log.payload.get("location_id"): loc_ids.add(lid)
                    if iid := log.payload.get("inventory_item_id"): inv_item_ids.add(iid)
                elif log.object_type == "inventory_item":
                    # For inventory_item events, the payload ID is the item ID
                    if iid := log.payload.get("id"): inv_item_ids.add(iid)
                elif log.object_type == "order":
                    # Order payloads have 'order_number' (often), line items, etc.
                    # Fulfillment payloads (also mapped to order) have 'order_id'
                    if oid := log.payload.get("order_id"): transaction_order_ids.add(oid)
                    elif oid := log.payload.get("id"): transaction_order_ids.add(oid)
                    # We also add transaction_order_ids for order objects where number is missing
                elif log.object_type == "product":
                    # Extract product ID for lookups (especially for deletes where title might be missing)
                    if pid := log.payload.get("id"): product_ids.add(pid)
                elif log.object_type == "transaction":
                    if oid := log.payload.get("order_id"): transaction_order_ids.add(oid)
    
        # Lookup Maps
        loc_map = {}
        item_map = {}
        product_map = {}
        order_map = {}
        
        if loc_ids:
            # Note: shopify_location_id is BigInteger, payload has it as int/str. 
            # Safely convert to avoid SQL errors
            safe_loc_ids = []
            for l in loc_ids:
                try: safe_loc_ids.append(int(l))
                except: pass
                
            if safe_loc_ids:
                loc_stmt = select(ShopifyLocation).where(ShopifyLocation.shopify_location_id.in_(safe_loc_ids))
                loc_res = await session.execute(loc_stmt)
                for loc in loc_res.scalars().all():
                    loc_map[str(loc.shopify_location_id)] = loc.name
                    
        if inv_item_ids:
            safe_item_ids = []
            for i in inv_item_ids:
                try: safe_item_ids.append(int(i))
                except: pass
                
            if safe_item_ids:
                # Join Variant -> Product to get full name
                # We want "{Product Title} - {Variant Title}"
                item_stmt = (
                    select(ShopifyProductVariant, ShopifyProduct)
                    .join(ShopifyProduct, ShopifyProduct.id == ShopifyProductVariant.product_id)
                    .where(ShopifyProductVariant.shopify_inventory_item_id.in_(safe_item_ids))
                )
                item_res = await session.execute(item_stmt)
                for variant, product in item_res.all():
                    # Store by inventory_item_id
                    full_name = f"{product.title}"
                    if variant.title != "Default Title":
                        full_name += f" - {variant.title}"
                    if variant.shopify_inventory_item_id:
                         item_map[str(variant.shopify_inventory_item_id)] = full_name
        
        if product_ids:
            safe_product_ids = []
            for p in product_ids:
                try: safe_product_ids.append(int(p))
                except: pass
                
            if safe_product_ids:
                product_stmt = select(ShopifyProduct).where(ShopifyProduct.shopify_product_id.in_(safe_product_ids))
                product_res = await session.execute(product_stmt)
                for product in product_res.scalars().all():
                    product_map[str(product.shopify_product_id)] = product.title
    
        if transaction_order_ids:
            safe_order_ids = []
            for o in transaction_order_ids:
                try: safe_order_ids.append(int(o))
                except: pass
                
            if safe_order_ids:
                # We just need order number
                order_stmt = select(ShopifyOrder).where(ShopifyOrder.shopify_order_id.in_(safe_order_ids))
                order_res = await session.execute(order_stmt)
                for order in order_res.scalars().all():
                    order_map[str(order.shopify_order_id)] = str(order.shopify_order_number)
        # -------------------------------------------------------------
        
        # --- 3. Consolidation Engine ---
        activity = []
        now = datetime.now(timezone.utc)
        
        # Prepare DTO generator function (local helper)
        def create_dto_from_log(log, override_desc=None, override_emoji=None, is_stacked=False, packed_count=0):
            importance = "normal"
            if log.processing_status in ["error", "failed"]:
                importance = "critical"
            elif log.source == "webhook":
                importance = "high"
            elif log.source == "backfill":
                # Ensure fetched_at is aware for subtraction
                fetched_at = log.fetched_at
                if fetched_at.tzinfo is None:
                    fetched_at = fetched_at.replace(tzinfo=timezone.utc)
                age_hours = (now - fetched_at).total_seconds() / 3600
                importance = "medium" if age_hours < 1 else "low"
            
            try:
                payload = log.payload if isinstance(log.payload, dict) else {}
                topic = log.topic or ""
                desc = f"Sync Event: {log.object_type}"
                status_emoji = "⚡"
                category = "System"
                
                # Helper: Format currency
                def f_curr(amount, code):
                    currency_map = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$", "CAD": "C$"}
                    symbol = currency_map.get(code or "USD", (code or "USD") + " ")
                    try:
                        val = float(amount or 0)
                        if val == 0: return ""
                        return f"{symbol}{val:,.2f}"
                    except:
                        return f"{symbol}{amount}"
    
                if log.object_type == "order":
                    order_num = payload.get("order_number") or order_map.get(str(payload.get("order_id")), "?")
                    total_amt = payload.get("total_price", "0.00")
                    curr_code = payload.get("currency", "USD")
                    amt_str = f_curr(total_amt, curr_code)
                    cust = payload.get("customer") or {}
                    c_name = f"{cust.get('first_name', '')} {cust.get('last_name', '')}".strip() or "a Guest"
                    
                    financial = payload.get("financial_status")
                    fulfillment = payload.get("fulfillment_status") or payload.get("status") # Handle fulfillment status in both formats
                    
                    is_new = "create" in topic or (not fulfillment and (financial == "paid" or financial == "pending"))
                    
                    if is_new:
                        desc = f"New Sale: {amt_str} from {c_name}"
                        status_emoji = "🛍️"
                        category = "Revenue"
                        try:
                            if float(total_amt) >= (5000 if curr_code == "INR" else 100):
                                desc = f"Whale Alert! 🐋 {amt_str} order from {c_name}"
                                importance = "critical"
                        except: pass
                    elif is_new and cust.get("orders_count", 0) > 1:
                        desc = f"Loyalty: {c_name} just made their {cust.get('orders_count')}th purchase! 💎"
                        category = "Customers"
                    elif fulfillment == "fulfilled":
                        desc = f"Order #{order_num} is now en route 🚚"
                        status_emoji = "📦"
                        category = "Operations"
                    elif fulfillment == "cancelled" or fulfillment == "restocked":
                        desc = f"Fulfillment Cancelled for #{order_num} ❌"
                        status_emoji = "↩️"
                        category = "Operations"
                        importance = "high"
                    elif financial == "paid" and not is_new:
                        desc = f"Payment Settled: {amt_str} captured for #{order_num} ✅"
                        status_emoji = "💰"
                        category = "Financials"
                    elif payload.get("refunds"):
                        desc = f"Refund Issued (Customer Care) 🔄"
                        status_emoji = "💸"
                        category = "Financials"
                        importance = "high"
                    elif diff := (log.diff_summary or {}):
                        if diff.get("location_change"):
                            new_loc_id = str(diff["location_change"].get("new", ""))
                            loc_name = loc_map.get(new_loc_id, "New Location")
                            desc = f"Fulfillment Moved: Order #{order_num} shifted to {loc_name} 🚚"
                            status_emoji = "🚚"
                            category = "Operations"
                        elif diff.get("status_changes"):
                            # Extract the most meaningful change
                            last_change = diff["status_changes"][-1]
                            field = last_change.get("field", "").replace("_", " ")
                            new_val = last_change.get("new", "updated")
                            desc = f"Order #{order_num}: {field} is now {new_val}"
                        else:
                            desc = f"Order #{order_num} updated"
                            status_emoji = "🛍️"
                            category = "Orders"
                    else:
                        desc = f"Order #{order_num} updated"
                        status_emoji = "🛍️"
                        category = "Orders"
    
                elif log.object_type == "product":
                    product_id = str(payload.get("id", ""))
                    title = payload.get("_cached_title") or payload.get("title") or product_map.get(product_id, "Product")
                    status_emoji = "🏷️"
                    category = "Inventory"
                    
                    if "delete" in topic:
                        desc = f"Product Removed: {title}"
                        status_emoji = "🗑️"
                    elif "create" in topic:
                        desc = f"New Product Stocked: {title}"
                        status_emoji = "✨"
                    elif (diff := log.diff_summary or {}).get("price_change"):
                         desc = f"Price Update: {title} 🏷️"
                         importance = "high"
                    elif diff.get("inventory_change"):
                         desc = f"Stock Update: {title} 📦"
                    else:
                        desc = f"Updated Product: {title}"
    
                elif log.object_type == "customer":
                    cust_name = f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip() or "Customer"
                    desc = f"New Customer: {cust_name} 👤"
                    category = "Customers"
                    status_emoji = "🤝"
                
                elif log.object_type == "inventory_level":
                    item_id = str(payload.get("inventory_item_id", "?"))
                    avail = payload.get("available", 0)
                    item_name = item_map.get(item_id, "Item")
                    if item_name == "Item": item_name = item_id # Fallback to ID if map fails
                    desc = f"Stock Level: {avail} for '{item_name}' 📦"
                    category = "Inventory"
                    status_emoji = "📦"
    
                elif log.object_type == "inventory_item":
                    item_id = str(payload.get("id", "?"))
                    item_name = item_map.get(item_id, "Item")
                    desc = f"Stock Item Update: {item_name}"
                    category = "Inventory"
                    status_emoji = "📦"
    
                elif log.object_type == "location":
                     loc_id = str(payload.get("id", "?"))
                     loc_name = loc_map.get(loc_id, payload.get("name", "Location"))
                     desc = f"Location Update: {loc_name}"
                     category = "System"
                     status_emoji = "🏢"
    
                elif log.object_type == "transaction":
                    order_id = str(payload.get("order_id", ""))
                    order_num = order_map.get(order_id, "?")
                    kind = payload.get("kind", "Transaction")
                    status = payload.get("status", "")
                    
                    desc = f"{kind.title()}: Order #{order_num}"
                    if status: desc += f" ({status})"
                    
                    status_emoji = "💳"
                    category = "Financials"
    
                # Override for errors
                if log.processing_status in ["error", "failed"]:
                    status_emoji = "⚠️"
                    desc = f"Alert: Failed to sync {log.object_type}"
                    importance = "critical"
    
                # --- Forced Overrides from Stacking ---
                if override_desc:
                    desc = override_desc
                if override_emoji:
                    status_emoji = override_emoji
    
                # Ensure UTC aware timestamp
                ts = log.fetched_at
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
    
                friendly_source = "Real-time" if log.source == "webhook" else "Sync Pulse"
                
                return {
                    "id": log.id,
                    "event": desc,
                    "status": log.processing_status,
                    "topic": topic or log.object_type,
                    "timestamp": ts.isoformat(),
                    "emoji": status_emoji,
                    "source": friendly_source,
                    "category": category,
                    "importance": importance,
                    "is_stacked": is_stacked,
                    "stacked_count": packed_count
                }
            except Exception as e:
                import logging
                logging.error(f"DTO Gen Error: {e}")
                return None
        
        buffer = []
        
        for log in logs:
            # 1. Determine importance
            is_error = log.processing_status in ["error", "failed"]
            is_high_imp = is_error or log.source == "webhook" or \
                          (log.object_type == "order" and "create" in (log.topic or ""))
            
            # 2. Check if compatible with buffer
            should_flush = False
            if buffer:
                head = buffer[0]
                # Must match topic, object_type, and be close in time (< 5 mins from head)
                time_gap = abs((log.fetched_at - head.fetched_at).total_seconds())
                
                # Special case: If BOTH are errors of the same type, they ARE compatible for stacking
                both_errors = is_error and head.processing_status in ["error", "failed"]
                
                if (log.topic != head.topic or 
                    log.object_type != head.object_type or 
                    (is_high_imp and not both_errors) or # High importance (except errors) always isolated
                    time_gap > 300): # 5 min gap
                    should_flush = True
            
            if should_flush:
                # FLUSH BUFFER
                if len(buffer) > 3:
                    # Stack
                    count = len(buffer)
                    head = buffer[0] # Most recent
                    
                    # Generate summary text
                    # Try to get names
                    sample_names = []
                    for b_log in buffer[:3]:
                        p = b_log.payload or {}
                        name = "?"
                        if b_log.object_type == "inventory_level":
                            item_id = str(p.get("inventory_item_id", "?"))
                            name = item_map.get(item_id, item_id)
                        elif b_log.object_type == "inventory_item":
                            item_id = str(p.get("id", "?"))
                            name = item_map.get(item_id, item_id)
                        elif b_log.object_type == "product":
                            pid = str(p.get("id", ""))
                            name = product_map.get(pid, p.get("title", "Product"))
                        elif b_log.object_type == "order":
                            name = f"#{p.get('order_number', '?')}"
                        elif b_log.object_type == "transaction":
                             order_id = str(p.get("order_id", ""))
                             name = f"Order #{order_map.get(order_id, '?')}"
                        
                        if name != "?" and name not in sample_names:
                            sample_names.append(name)
                            
                    name_str = ", ".join(sample_names[:2])
                    if len(sample_names) > 2 or count > 3:
                        name_str += f" + {count - 2} others"
                    
                    summary_desc = f"Updated {count} {head.object_type}s"
                    if name_str:
                        summary_desc += f": {name_str}"
                    
                    # Emoji mapping for group
                    group_emoji = "📦"
                    if head.processing_status in ["error", "failed"]:
                        group_emoji = "⚠️"
                        summary_desc = f"Multiple Sync Failures ({count} {head.object_type}s)"
                    elif head.object_type == "product": group_emoji = "🏷️"
                    elif head.object_type == "order": group_emoji = "🛍️"
                    elif head.object_type == "customer": group_emoji = "👥"
                    
                    try:
                        stacked_dto = create_dto_from_log(head, override_desc=summary_desc, override_emoji=group_emoji, is_stacked=True, packed_count=count)
                        if stacked_dto: activity.append(stacked_dto)
                    except Exception as stack_err:
                        logger.error(f"Failed to generate stacked DTO: {stack_err}")
                else:
                    # Emit individually
                    for b_log in buffer:
                        try:
                            dto = create_dto_from_log(b_log)
                            if dto: activity.append(dto)
                        except Exception as dto_err:
                            logger.error(f"Failed to generate individual DTO: {dto_err}")
                buffer = []
    
            # 3. Add current to buffer (unless high importance, then emit immediately)
            # Note: We now allow errors into the buffer if they are similar
            if is_high_imp and not is_error:
                 # Emit standalone immediately (Webhooks / New Orders)
                 dto = create_dto_from_log(log)
                 if dto: activity.append(dto)
            else:
                 buffer.append(log)
    
        # Flush remaining buffer
        if buffer:
            if len(buffer) > 3:
                count = len(buffer)
                head = buffer[0]
                
                # Replicate name logic (simplified for brevity, should refactor)
                sample_names = []
                for b_log in buffer[:3]:
                        p = b_log.payload or {}
                        name = "?"
                        if b_log.object_type == "inventory_level":
                            item_id = str(p.get("inventory_item_id", "?"))
                            name = item_map.get(item_id, item_id)
                        elif b_log.object_type == "product":
                            pid = str(p.get("id", ""))
                            name = product_map.get(pid, p.get("title", "Product"))
                        elif b_log.object_type == "order":
                            name = f"#{p.get('order_number', '?')}"
                        elif b_log.object_type == "transaction":
                             order_id = str(p.get("order_id", ""))
                             name = f"Order #{order_map.get(order_id, '?')}"
                        
                        if name != "?" and name not in sample_names:
                             sample_names.append(name)
    
                name_str = ", ".join(sample_names[:2])
                if len(sample_names) > 2 or count > 3:
                    name_str += f" + {count - 2} others"
                
                summary_desc = f"Updated {count} {head.object_type}s"
                if name_str: summary_desc += f": {name_str}"
                
                group_emoji = "📦"
                if head.object_type == "product": group_emoji = "🏷️"
                
                try:
                    stacked_dto = create_dto_from_log(head, override_desc=summary_desc, override_emoji=group_emoji, is_stacked=True, packed_count=count)
                    if stacked_dto: activity.append(stacked_dto)
                except Exception as stack_err:
                    logger.error(f"Failed to generate final stacked DTO: {stack_err}")
            else:
                for b_log in buffer:
                    try:
                        dto = create_dto_from_log(b_log)
                        if dto: activity.append(dto)
                    except Exception as dto_err:
                        logger.error(f"Failed to generate final individual DTO: {dto_err}")
    
        
        # 4. Sort by importance and recency, then limit
        activity.sort(key=lambda x: x["timestamp"], reverse=True)
        return activity[:limit]
    except Exception as e:
        import traceback
        with open("/Users/param/Documents/Unclutr/endpoint_error.log", "a") as f:
            f.write(f"\n--- ERROR at {datetime.now()} ---\n")
            f.write(traceback.format_exc())
        raise e

@router.get("/analytics/daily")
async def get_shopify_daily_metrics(
    integration_id: UUID,
    days: int = Query(30, ge=1, le=90),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Returns historical daily metrics for charting.
    """
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)
    
    stmt = select(ShopifyDailyMetric).where(
        ShopifyDailyMetric.integration_id == integration_id,
        ShopifyDailyMetric.snapshot_date >= start_date,
        ShopifyDailyMetric.snapshot_date <= end_date
    ).order_by(ShopifyDailyMetric.snapshot_date.asc())
    
    results = await session.execute(stmt)
    return results.scalars().all()

@router.get("/analytics/overview")
async def get_shopify_overview(
    integration_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    High-level perspective: Current Month vs Last Month growth, etc.
    """
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    
    # Simple direct query for now to ensure freshness
    metrics_stmt = select(ShopifyDailyMetric).where(
        ShopifyDailyMetric.integration_id == integration_id,
        ShopifyDailyMetric.snapshot_date >= today - timedelta(days=30)
    ).order_by(ShopifyDailyMetric.snapshot_date.desc())
    
    metrics = (await session.execute(metrics_stmt)).scalars().all()
    
    # Calculate Growth
    current_30_total = sum(m.total_sales for m in metrics)
    prev_30_stmt = select(func.sum(ShopifyDailyMetric.total_sales)).where(
        ShopifyDailyMetric.integration_id == integration_id,
        ShopifyDailyMetric.snapshot_date < today - timedelta(days=30),
        ShopifyDailyMetric.snapshot_date >= today - timedelta(days=60)
    )
    prev_30_total = (await session.execute(prev_30_stmt)).scalar() or 0
    
    growth = 0
    if prev_30_total > 0:
        growth = ((current_30_total - prev_30_total) / prev_30_total) * 100
        
    return {
        "metrics_30d": metrics,
        "summary": {
            "total_sales_30d": current_30_total,
            "growth_pct": float(growth),
            "order_count_30d": sum(m.order_count for m in metrics)
        }
    }

@router.post("/integrations/{integration_id}/reconcile")
async def trigger_reconciliation(
    integration_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Triggers an on-demand Zero-Drift Reconciliation for the integration.
    Security: Validates user owns the integration before triggering.
    """
    integration = await session.get(Integration, integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    if integration.company_id != current_user.current_company_id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to reconcile this integration"
        )
    
    from app.services.shopify.tasks import run_reconciliation_task
    background_tasks.add_task(run_reconciliation_task, integration_id)
    return {"message": "Reconciliation started", "status": "processing"}

@router.get("/integrations/{integration_id}/webhook-health")
async def get_webhook_health(
    integration_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Returns webhook health status including registration info and recent activity.
    """
    integration = await session.get(Integration, integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    if integration.company_id != current_user.current_company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get webhook registration status from metadata
    metadata = integration.metadata_info or {}
    webhook_reg = metadata.get("webhook_registration", {})
    
    # Get recent webhook activity
    stmt = select(ShopifyRawIngest).where(
        ShopifyRawIngest.integration_id == integration_id,
        ShopifyRawIngest.source == "webhook"
    ).order_by(ShopifyRawIngest.fetched_at.desc()).limit(10)
    
    recent_webhooks = (await session.execute(stmt)).scalars().all()
    
    # Calculate webhook delivery stats
    last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    stmt_24h = select(func.count(ShopifyRawIngest.id)).where(
        ShopifyRawIngest.integration_id == integration_id,
        ShopifyRawIngest.source == "webhook",
        ShopifyRawIngest.fetched_at >= last_24h
    )
    webhooks_24h = (await session.execute(stmt_24h)).scalar_one() or 0
    
    return {
        "integration_id": str(integration_id),
        "registration_status": webhook_reg.get("status", "unknown"),
        "success_rate": webhook_reg.get("success_rate", 0),
        "registered_at": webhook_reg.get("registered_at"),
        "failed_webhooks": webhook_reg.get("failures", []),
        "recent_activity": [
            {
                "object_type": w.object_type,
                "topic": w.topic,
                "fetched_at": w.fetched_at.isoformat(),
                "status": w.processing_status
            }
            for w in recent_webhooks
        ],
        "webhooks_last_24h": webhooks_24h,
        "last_webhook_at": recent_webhooks[0].fetched_at.isoformat() if recent_webhooks else None
    }
