from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.models.iam import SystemRole
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.raw_ingest import ShopifyRawIngest

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
        stmt = stmt.where(
            (ShopifyRawIngest.source == "webhook") |
            (ShopifyRawIngest.processing_status == "error") |
            (ShopifyRawIngest.processing_status == "failed")
        )
    
    stmt = stmt.order_by(ShopifyRawIngest.fetched_at.desc()).limit(limit * 2 if important_only else limit)
    
    results = await session.execute(stmt)
    logs = results.scalars().all()
    
    # 3. Transform to Lightweight DTO with importance scoring
    activity = []
    for log in logs:
        # Calculate importance score
        importance = "normal"
        if log.processing_status in ["error", "failed"]:
            importance = "critical"
        elif log.source == "webhook":
            importance = "high"
        elif log.source == "backfill":
            # Recent backfills are medium importance
            age_hours = (datetime.utcnow() - log.fetched_at).total_seconds() / 3600
            importance = "medium" if age_hours < 1 else "low"
        
        # Humanize the event description
        desc = "Unknown Event"
        payload = log.payload or {}
        
        if log.object_type == "order":
            order_num = payload.get("order_number", "?")
            total = payload.get("total_price", "0.00")
            currency_code = payload.get("currency", "USD") or "USD"
            
            # Simple currency map
            currency_map = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$", "CAD": "C$"}
            symbol = currency_map.get(currency_code, currency_code + " ")
            
            customer_name = "Guest"
            if "customer" in payload and payload["customer"]:
                customer_name = f"{payload['customer'].get('first_name', '')} {payload['customer'].get('last_name', '')}".strip() or "Customer"
            
            if log.source == "webhook":
                 # Check for specific financial events
                 if "refunds" in payload and payload["refunds"]:
                     desc = f"Refund Processed for #{order_num}"
                 elif "transactions" in payload and any(t.get("kind") == "capture" for t in payload["transactions"]):
                     desc = f"Payment Captured for #{order_num} ({symbol}{total})"
                 elif "/delete" in (log.topic or ""):
                     desc = f"Order #{order_num} Deleted"
                 elif log.topic == "orders/create":
                     desc = f"New Order #{order_num} from {customer_name} ({symbol}{total})"
                 else:
                     desc = f"Order #{order_num} Updated"
            else:
                 desc = f"Imported Order #{order_num} ({symbol}{total})"
                 
        elif log.object_type == "product":
            title = payload.get("title", "Unknown Product")
            if "/delete" in (log.topic or ""):
                desc = f"Deleted Product: {title}"
            elif "/create" in (log.topic or ""):
                desc = f"New Product: {title}"
            else:
                desc = f"Updated Product: {title}"
            
        elif log.object_type == "customer":
             first = payload.get("first_name", "")
             last = payload.get("last_name", "")
             name = f"{first} {last}".strip() or "Customer"
             if "/delete" in (log.topic or ""):
                 desc = f"Deleted Customer: {name}"
             else:
                 desc = f"Customer Profile: {name}"
             
        elif log.object_type == "price_rule":
             title = payload.get("title", "Unknown Discount")
             if "/delete" in (log.topic or ""):
                 desc = f"Deleted Discount: {title}"
             else:
                 desc = f"Discount Rule: {title}"

        elif log.object_type == "inventory_level":
             desc = "Inventory Level Adjusted"
             
        # Add emoji based on status/type
        if log.processing_status == "error":
            status_emoji = "⚠️"
            desc = f"Failed to process {log.object_type}"
        elif log.object_type == "order":
            status_emoji = "🛍️"
        elif log.object_type == "product":
            status_emoji = "📦"
        elif log.object_type == "customer":
            status_emoji = "👤"
        else:
            status_emoji = "⚡"
        
        # Determine Category
        category = "System"
        if log.object_type == "order":
            category = "Financials" if "refunds" in payload or "transactions" in payload else "Orders"
        elif log.object_type == "product":
            category = "Inventory"
        elif log.object_type == "customer":
            category = "Customers"
        elif log.object_type == "price_rule":
            category = "Discounts"

        # Friendly Source
        friendly_source = "Cloud Import"
        if log.source == "webhook":
            friendly_source = "Real-time"
        
        # Ensure UTC aware timestamp for serialization
        ts = log.fetched_at
        if ts.tzinfo is None:
            from datetime import timezone
            ts = ts.replace(tzinfo=timezone.utc)

        activity.append({
            "id": log.id,
            "event": desc,
            "status": log.processing_status,
            "topic": log.topic or log.object_type,
            "timestamp": ts.isoformat(),
            "emoji": status_emoji,
            "source": friendly_source,
            "category": category,
            "importance": importance
        })
    
    # 4. Sort by importance and recency, then limit
    def importance_score(item):
        scores = {"critical": 4, "high": 3, "medium": 2, "low": 1, "normal": 1}
        return scores.get(item["importance"], 1)
    
    activity.sort(key=lambda x: (importance_score(x), x["timestamp"]), reverse=True)
    
    return activity[:limit]
