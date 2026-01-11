import json
import hashlib
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from uuid import UUID
from loguru import logger
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.models.integration import Integration
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.services.shopify.oauth_service import shopify_oauth_service
from app.core.config import settings

class ShopifySyncService:
    def __init__(self):
        self.api_version = "2024-01"

    async def fetch_and_ingest_orders(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Orchestrates the backfill of Orders.
        1. Gets Access Token
        2. Pages through Shopify 'orders.json'
        3. Ingests raw data
        """
        # 1. Get Credentials
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        if not integration or not integration.metadata_info.get("shop"):
             raise ValueError("Integration invalid or missing shop url")
        
        shop_domain = integration.metadata_info["shop"]
        
        store_stats = await self.fetch_store_stats(shop_domain, token)
        
        # Initialize sync stats with global store counts immediately
        current_meta = integration.metadata_info or {}
        sync_stats = current_meta.get("sync_stats", {})
        sync_stats.update({
             "orders_count": store_stats.get("orders_count", 0),
             "products_count": store_stats.get("products_count", 0),
             "discounts_count": store_stats.get("price_rules_count", 0),
             "customers_count": store_stats.get("customers_count", 0),
             "total_revenue": store_stats.get("total_revenue", 0.0),
             "currency": store_stats.get("currency", "USD"),
             "message": "Initializing data stream..."
        })
        integration.metadata_info = dict(current_meta)
        session.add(integration)
        await session.commit()
        
        stats = {"fetched": 0, "ingested": 0, "errors": 0}
        
        # 2. Prepare Client
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/orders.json"
            params = {
                "status": "any",
                "limit": 250,
            }
            if start_date:
                params["updated_at_min"] = start_date.isoformat()
                logger.info(f"Triggering delta sync for {shop_domain} since {params['updated_at_min']}")

            next_page_info = None
            page_count = 0
            max_pages = 5 if not start_date else 2 # Delta syncs should be much smaller
            
            # Pagination Loop
            while True:
                if page_count >= max_pages:
                    logger.warning(f"Safety limit reached: {max_pages} pages synced. Stopping.")
                    break
                
                try:
                    page_count += 1
                    request_params = params.copy()
                    if next_page_info:
                         # Cursor-based pagination for older versions or Link header
                         request_params = {"page_info": next_page_info, "limit": 250}
                    
                    # Update progress message
                    current_meta = integration.metadata_info or {}
                    sync_stats = current_meta.get("sync_stats", {})
                    sync_stats.update({
                        "message": f"Streaming batch {page_count} of historical data...",
                        "progress": min(90, int((page_count / max_pages) * 100))
                    })
                    integration.metadata_info = dict(current_meta)
                    session.add(integration)
                    await session.commit()

                    response = await client.get(
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=request_params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    orders = data.get("orders", [])
                    
                    if not orders:
                        break
                        
                    # 3. Ingest Batch
                    for order in orders:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="order",
                            payload=order
                        )
                        stats["ingested"] += 1
                    
                    stats["fetched"] += len(orders)
                    logger.info(f"Synced batch of {len(orders)} orders for {shop_domain}")
                    
                    # Update progress message (keep global counts preserved)
                    current_meta = integration.metadata_info or {}
                    sync_stats = current_meta.get("sync_stats", {})
                    sync_stats.update({
                        "session_fetched": stats["fetched"], # Internal progress
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    })
                    current_meta["sync_stats"] = sync_stats
                    
                    # Update progress in DB for polling
                    from sqlalchemy.orm.attributes import flag_modified
                    integration.metadata_info = current_meta
                    flag_modified(integration, "metadata_info")
                    session.add(integration)
                    await session.commit()

                    # Check Link header for next page
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    
                    if not next_page_info:
                        break
                        
                except Exception as e:
                    logger.error(f"Sync loop failed: {str(e)}")
                    stats["errors"] += 1
                    break
                    
        return stats

    async def fetch_store_stats(self, shop_domain: str, token: str) -> Dict[str, Any]:
        """Fetches total counts for various Shopify resources."""
        resources = ["orders", "products", "customers", "price_rules"]
        stats = {}
        
        async with httpx.AsyncClient() as client:
            for res in resources:
                url = f"https://{shop_domain}/admin/api/{self.api_version}/{res}/count.json"
                try:
                    params = {"status": "any"} if res == "orders" else {}
                    resp = await client.get(url, headers={"X-Shopify-Access-Token": token}, params=params)
                    if resp.status_code == 200:
                        count = resp.json().get("count", 0)
                        stats[f"{res}_count"] = count
                except Exception as e:
                    logger.error(f"Error fetching count for {res}: {e}")
            
            # Also fetch basic shop info for currency
            try:
                shop_resp = await client.get(f"https://{shop_domain}/admin/api/{self.api_version}/shop.json", headers={"X-Shopify-Access-Token": token})
                if shop_resp.status_code == 200:
                    shop_data = shop_resp.json().get("shop", {})
                    stats["currency"] = shop_data.get("currency", "USD")
            except Exception as e:
                logger.error(f"Error fetching shop info: {e}")

        return stats

    async def ingest_raw_object(
        self,
        session: AsyncSession,
        integration: Integration,
        object_type: str,
        payload: Dict[str, Any],
        source: str = "backfill",
        topic: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> ShopifyRawIngest:
        """
        Canonicalizes and stores the raw JSON payload.
        Idempotent based on (integration_id, dedupe_hash_canonical).
        """
        # 1. Identity
        shopify_id = payload.get("id")
        updated_at_str = payload.get("updated_at")
        updated_at = datetime.fromisoformat(updated_at_str) if updated_at_str else None
        
        # Normalize to UTC Naive for DB
        if updated_at and updated_at.tzinfo:
            updated_at = updated_at.astimezone(timezone.utc).replace(tzinfo=None)

        # 2. Canonical Hash
        # Sort keys to ensure consistent JSON string
        canonical_json = json.dumps(payload, sort_keys=True)
        dedupe_hash = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
        
        # 3. Simple Hash
        dedupe_key = f"{integration.id}_{object_type}_{shopify_id}_{updated_at}"
        
        # 4. Check Existence (Deduplication)
        stmt = select(ShopifyRawIngest).where(
            ShopifyRawIngest.integration_id == integration.id,
            ShopifyRawIngest.dedupe_hash_canonical == dedupe_hash
        )
        result = await session.execute(stmt)
        existing = result.scalars().first()
        
        if existing:
            return existing

        # 5. Create
        ingest_record = ShopifyRawIngest(
            integration_id=integration.id,
            company_id=integration.company_id,
            object_type=object_type,
            shopify_object_id=shopify_id,
            shopify_updated_at=updated_at,
            dedupe_key=dedupe_key,
            dedupe_hash_canonical=dedupe_hash,
            source=source,
            topic=topic or f"{object_type}/backfill",
            api_version=self.api_version,
            payload=payload,
            processing_status="pending",
            created_by=created_by,
            updated_by=created_by
        )
        
        session.add(ingest_record)
        # We perform a partial commit/flush depending on batch strategy?
        # For safety in this service, let's flush per object or batch.
        # Calling flush() allows ID generation without full commit if wrapping tx.
        # await session.flush() 
        # But we'll rely on the caller or batch commit.
        
        return ingest_record

    def _get_next_page_info(self, link_header: Optional[str]) -> Optional[str]:
        """
        Parses Shopify 'Link' header to extract page_info for 'next'.
        Format: <url?page_info=...>; rel="next"
        """
        if not link_header:
            return None
        
        links = link_header.split(',')
        for link in links:
            if 'rel="next"' in link:
                # Extract URL
                url_part = link.split(';')[0].strip('<> ')
                # Extract page_info param
                try:
                    from urllib.parse import urlparse, parse_qs
                    parsed = urlparse(url_part)
                    return parse_qs(parsed.query)['page_info'][0]
                except Exception:
                    return None
        return None

shopify_sync_service = ShopifySyncService()
