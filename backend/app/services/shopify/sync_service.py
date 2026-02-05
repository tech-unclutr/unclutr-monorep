import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from loguru import logger
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.services.shopify.oauth_service import shopify_oauth_service


class ShopifySyncService:
    def __init__(self):
        self.api_version = "2024-01"

    async def _make_request(self, client: httpx.AsyncClient, url: str, headers: Dict, params: Optional[Dict] = None) -> httpx.Response:
        """
        Executes HTTP request with explicit 429 Rate Limit handling (Leaky Bucket / Retry-After).
        """
        retries = 3
        base_delay = 1.0
        
        for attempt in range(retries):
            try:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 429:
                    retry_after = float(response.headers.get("Retry-After", base_delay * (2 ** attempt)))
                    logger.warning(f"Shopify Rate Limit Hit (429). Sleeping for {retry_after}s...")
                    import asyncio
                    await asyncio.sleep(retry_after)
                    continue
                    
                return response
                
            except httpx.RequestError as e:
                logger.warning(f"Request failed (Attempt {attempt+1}/{retries}): {e}")
                if attempt == retries - 1:
                    raise
        
        return response

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
                # Ensure start_date is aware before formatting
                if start_date.tzinfo is None:
                    start_date = start_date.replace(tzinfo=timezone.utc)
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

                    response = await self._make_request(
                        client,
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
                    
                    # Store order IDs for subsequent transaction fetch
                    if "order_ids" not in stats:
                        stats["order_ids"] = []
                    stats["order_ids"].extend([o["id"] for o in orders])
                    
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
                        
                    if not next_page_info:
                        break
                        
                except Exception as e:
                    logger.error(f"Sync loop failed: {str(e)}")
                    stats["errors"] += 1
                    break
                    
        return stats, stats.get("order_ids", []) # Returning IDs for transaction fetch

    async def fetch_and_ingest_customers(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Orchestrates the backfill of Customers.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        if not integration or not integration.metadata_info.get("shop"):
             raise ValueError("Integration invalid or missing shop url")
        
        shop_domain = integration.metadata_info["shop"]
        stats = {"fetched": 0, "ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/customers.json"
            params = {"limit": 250}
            if start_date:
                # Ensure start_date is aware before formatting
                if start_date.tzinfo is None:
                    start_date = start_date.replace(tzinfo=timezone.utc)
                params["updated_at_min"] = start_date.isoformat()

            next_page_info = None
            page_count = 0
            
            while True:
                try:
                    page_count += 1
                    request_params = params.copy()
                    if next_page_info:
                         request_params = {"page_info": next_page_info, "limit": 250}
                    
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=request_params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Customer Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    customers = data.get("customers", [])
                    if not customers:
                        break
                        
                    for customer in customers:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="customer",
                            payload=customer
                        )
                        stats["ingested"] += 1
                    
                    stats["fetched"] += len(customers)
                    logger.info(f"Synced batch of {len(customers)} customers for {shop_domain}")
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                        
                except Exception as e:
                    logger.error(f"Customer sync loop failed: {str(e)}")
                    stats["errors"] += 1
                    break
        
        return stats

    async def fetch_and_ingest_transactions(
        self,
        session: AsyncSession,
        integration_id: UUID,
        order_ids: List[int]
    ) -> Dict[str, int]:
        """
        Fetches Transactions for a list of Order IDs.
        Transactions are a sub-resource of Orders.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        if not integration or not integration.metadata_info.get("shop"):
             raise ValueError("Integration invalid or missing shop url")
        
        shop_domain = integration.metadata_info["shop"]
        stats = {"fetched": 0, "ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for order_id in order_ids:
                try:
                    base_url = f"https://{shop_domain}/admin/api/{self.api_version}/orders/{order_id}/transactions.json"
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token}
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Transaction Sync Error for Order {order_id}: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        continue
                        
                    data = response.json()
                    transactions = data.get("transactions", [])
                    
                    for txn in transactions:
                        # Add order_id to payload if not present (Shopify usually includes it but good to be sure)
                        if "order_id" not in txn:
                            txn["order_id"] = order_id
                            
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="transaction",
                            payload=txn
                        )
                        stats["ingested"] += 1
                    
                    stats["fetched"] += len(transactions)
                    
                except Exception as e:
                    logger.error(f"Transaction sync failed for Order {order_id}: {str(e)}")
                    stats["errors"] += 1
        
        return stats

    async def fetch_and_ingest_products(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Orchestrates the backfill of Products.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        if not integration or not integration.metadata_info.get("shop"):
             raise ValueError("Integration invalid or missing shop url")
        
        shop_domain = integration.metadata_info["shop"]
        stats = {"fetched": 0, "ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/products.json"
            params = {"limit": 250}
            if start_date:
                params["updated_at_min"] = start_date.isoformat()

            next_page_info = None
            page_count = 0
            
            while True:
                try:
                    page_count += 1
                    request_params = params.copy()
                    if next_page_info:
                         request_params = {"page_info": next_page_info, "limit": 250}
                    
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=request_params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Product Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    products = data.get("products", [])
                    if not products:
                        break
                        
                    for product in products:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="product",
                            payload=product
                        )
                        stats["ingested"] += 1
                    
                    stats["fetched"] += len(products)
                    logger.info(f"Synced batch of {len(products)} products for {shop_domain}")
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                        
                except Exception as e:
                    logger.error(f"Product sync loop failed: {str(e)}")
                    stats["errors"] += 1
                    break
        
        return stats

        return stats

    async def fetch_and_ingest_inventory_items(
        self,
        session: AsyncSession,
        integration_id: UUID,
        inventory_item_ids: List[int]
    ) -> Dict[str, int]:
        """
        Fetches InventoryItems by ID to get Cost data.
        InventoryItem IDs come from Product Variants.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        # Split into chunks of 100 max (Shopify limit for ids filter)
        def chunker(seq, size):
            return (seq[pos:pos + size] for pos in range(0, len(seq), size))
            
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/inventory_items.json"
            
            for chunk in chunker(inventory_item_ids, 50):
                try:
                    params = {"ids": ",".join(map(str, chunk)), "limit": 50}
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Inventory Items Sync Error: {response.text}")
                        stats["errors"] += 1
                        continue
                        
                    data = response.json()
                    items = data.get("inventory_items", [])
                    
                    for item in items:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="inventory_item",
                            payload=item
                        )
                        stats["ingested"] += 1
                        
                except Exception as e:
                    logger.error(f"Inventory item sync chunk failed: {e}")
                    stats["errors"] += 1
                    
        return stats

    async def fetch_and_ingest_reports(
        self,
        session: AsyncSession,
        integration_id: UUID
    ) -> Dict[str, int]:
        """
        Fetches all Shopify Reports (Admin API).
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/reports.json"
            params = {"limit": 250}
            
            try:
                # Reports resource usually doesn't have thousands of records, so simple pagination ok
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Reports Sync Error: {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    reports = data.get("reports", [])
                    
                    for report in reports:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="report",
                            payload=report
                        )
                        stats["ingested"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Reports sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    def _validate_shopify_ql(self, query: str) -> bool:
        """
        Basic validation of ShopifyQL syntax to prevent wasted API calls.
        """
        if not query or not query.strip():
            logger.warning("Empty ShopifyQL query")
            return False
        
        query_upper = query.upper()
        
        # Check for required FROM clause
        if "FROM" not in query_upper:
            logger.warning(f"Invalid ShopifyQL: missing FROM clause in '{query[:50]}...'")
            return False
        
        # Check for dangerous patterns (defense in depth if queries become user-generated)
        dangerous = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE"]
        if any(word in query_upper for word in dangerous):
            logger.error(f"Dangerous ShopifyQL pattern detected: {query[:50]}...")
            return False
        
        return True

    async def execute_shopify_ql(
        self,
        session: AsyncSession,
        integration_id: UUID,
        query: str,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Executes a raw ShopifyQL query via the Analytics API.
        Handles rate limiting with automatic retry and exponential backoff.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/shopify_ql.json"
            
            for attempt in range(max_retries):
                try:
                    with SHOPIFY_QL_DURATION.labels(integration_id=str(integration_id), query_type="custom").time():
                        response = await self._make_request(
                            client,
                            base_url,
                            headers={"X-Shopify-Access-Token": token},
                            params={"query": query}
                        )
                    
                    # Handle rate limiting
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 2))
                        logger.warning(f"Rate limited on ShopifyQL query. Retrying after {retry_after}s (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(retry_after)
                        continue
                    
                    if response.status_code != 200:
                        logger.error(f"ShopifyQL Error: {response.status_code} {response.text}")
                        SHOPIFY_QL_ERRORS.labels(
                            integration_id=str(integration_id), 
                            error_type=f"http_{response.status_code}"
                        ).inc()
                        return {"error": response.text, "status_code": response.status_code}
                        
                    data = response.json()
                    # Ingest the result as raw data
                    await self.ingest_raw_object(
                        session=session,
                        integration=integration,
                        object_type="analytics_data",
                        payload={"query": query, "result": data},
                        topic="analytics/execution"
                    )
                    return data
                    
                except Exception as e:
                    logger.error(f"ShopifyQL execution failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
                    SHOPIFY_QL_ERRORS.labels(
                        integration_id=str(integration_id),
                        error_type="exception"
                    ).inc()
                    if attempt == max_retries - 1:
                        return {"error": str(e)}
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
            return {"error": "Max retries exceeded"}

    async def sync_report_data(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Fetches data for all ShopifyQL-enabled reports.
        Executes queries and ingests results as 'report_data'.
        """
        from app.models.shopify.analytics import ShopifyReport
        
        stats = {"executed": 0, "ingested": 0, "errors": 0}
        
        # Fetch all reports for this integration that have shopify_ql
        stmt = select(ShopifyReport).where(
            ShopifyReport.integration_id == integration_id,
            ShopifyReport.shopify_ql.isnot(None)
        )
        result = await session.execute(stmt)
        reports = result.scalars().all()
        
        logger.info(f"Found {len(reports)} reports with ShopifyQL queries for integration {integration_id}")
        
        for report in reports:
            try:
                # Validate ShopifyQL query before execution
                if not self._validate_shopify_ql(report.shopify_ql):
                    logger.error(f"Skipping invalid ShopifyQL query for report: {report.name}")
                    stats["errors"] += 1
                    continue
                
                # Check if we already synced this report today (same-day deduplication)
                # Skip dedup if custom range is provided
                from datetime import date

                from sqlalchemy import func

                from app.models.shopify.analytics import ShopifyReportData
                
                today = date.today()
                is_custom_range = bool(start_date or end_date)
                
                if not is_custom_range:
                    dedup_stmt = select(ShopifyReportData).where(
                        ShopifyReportData.integration_id == integration_id,
                        ShopifyReportData.query_name == report.name,
                        func.date(ShopifyReportData.captured_at) == today
                    )
                    existing_today = (await session.execute(dedup_stmt)).scalars().first()
                    
                    if existing_today:
                        logger.info(f"Report '{report.name}' already synced today. Skipping to avoid duplicates.")
                        continue
                
                logger.info(f"Executing ShopifyQL for report: {report.name} (Range: {start_date} to {end_date})")
                
                # Apply range to query
                query_with_range = report.shopify_ql
                if start_date or end_date:
                    query_with_range = self._inject_range_into_shopify_ql(report.shopify_ql, start_date, end_date)
                
                # Execute the query
                result_data = await self.execute_shopify_ql(
                    session=session,
                    integration_id=integration_id,
                    query=query_with_range
                )
                
                if "error" in result_data:
                    logger.error(f"ShopifyQL execution failed for {report.name}: {result_data['error']}")
                    stats["errors"] += 1
                    continue
                
                # Ingest the result as report_data
                integration = await session.get(Integration, integration_id)
                await self.ingest_raw_object(
                    session=session,
                    integration=integration,
                    object_type="report_data",
                    payload={
                        "report_id": str(report.id),
                        "report_name": report.name,
                        "query": report.shopify_ql,
                        "result": result_data
                    },
                    topic=f"analytics/report/{report.name}"
                )
                
                stats["executed"] += 1
                stats["ingested"] += 1
                
            except Exception as e:
                logger.error(f"Report data sync failed for {report.name}: {str(e)}")
                stats["errors"] += 1
        
        return stats


    async def fetch_and_ingest_payouts(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Fetches Shopify Payments Payouts.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/shopify_payments/payouts.json"
            params = {"limit": 250}
            if start_date:
                params["date_min"] = start_date.strftime("%Y-%m-%d")

            try:
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        # 404/403 means likely not using Shopify Payments
                        logger.warning(f"Shopify Payouts Sync skipped/failed: {response.status_code} {response.text}")
                        # Don't error out hard, just return
                        return stats
                        
                    data = response.json()
                    payouts = data.get("payouts", [])
                    
                    for pay in payouts:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="payout",
                            payload=pay
                        )
                        stats["ingested"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Payouts sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    async def fetch_and_ingest_disputes(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Fetches Shopify Payments Disputes.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/shopify_payments/disputes.json"
            params = {"limit": 250}
            if start_date:
                params["initiated_at_since"] = start_date.strftime("%Y-%m-%d")

            try:
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.warning(f"Shopify Disputes Sync skipped/failed: {response.status_code} {response.text}")
                        return stats
                        
                    data = response.json()
                    disputes = data.get("disputes", [])
                    
                    for dispute in disputes:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="dispute",
                            payload=dispute
                        )
                        stats["ingested"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Disputes sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    async def fetch_and_ingest_balance_transactions(
        self,
        session: AsyncSession,
        integration_id: UUID,
        payout_id: Optional[int] = None
    ) -> Dict[str, int]:
        """
        Fetches Shopify Payments Balance Transactions.
        Can optionally filter by payout_id, but usually we want to sync all new ones.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/shopify_payments/balance/transactions.json"
            params = {"limit": 250}
            if payout_id:
                params["payout_id"] = payout_id

            try:
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.warning(f"Shopify Balance Transactions Sync skipped/failed: {response.status_code} {response.text}")
                        return stats
                        
                    data = response.json()
                    transactions = data.get("transactions", [])
                    
                    for txn in transactions:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="balance_transaction",
                            payload=txn
                        )
                        stats["ingested"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        # Transactions endpoint logic for pagination might be standard
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Balance Transactions sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    async def fetch_and_ingest_inventory(
        self,
        session: AsyncSession,
        integration_id: UUID
    ) -> Dict[str, int]:
        """
        Orchestrates the backfill of Inventory (Locations + Levels + Items).
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"locations": 0, "levels": 0, "items": 0, "errors": 0}
        
        # 1. Sync Locations
        loc_stats = await self.fetch_and_ingest_locations(session, integration, token, shop_domain)
        stats["locations"] = loc_stats["ingested"]
        stats["errors"] += loc_stats["errors"]
        
        # Targeted Refinement: Locations must be refined before we can query them to fetch levels
        await session.commit()
        from app.services.shopify.refinement_service import shopify_refinement_service
        await shopify_refinement_service.process_pending_records(session, integration_id=integration_id, limit=100)
        await session.commit()
        
        # 2. Sync Inventory Levels
        # We fetch all inventory levels. This can be large, so we page it.
        # We also collect inventory_item_ids to fetch their details (Cost)
        collected_item_ids = set()
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/inventory_levels.json"
            
            from app.models.shopify.inventory import ShopifyLocation
            result = await session.execute(select(ShopifyLocation).where(ShopifyLocation.integration_id == integration_id))
            locations = result.scalars().all()
            location_ids = [str(l.shopify_location_id) for l in locations]
            
            if not location_ids:
                logger.warning(f"No locations found for {shop_domain}. Skipping inventory levels.")
                return stats
            
            # Fetch levels for all locations (batched by location_ids if too many?)
            # Shopify allows comma-separated location_ids.
            
            params = {"location_ids": ",".join(location_ids), "limit": 250}
            next_page_info = None
            
            while True:
                try:
                    request_params = params.copy()
                    if next_page_info:
                         request_params = {"page_info": next_page_info, "limit": 250}
                    
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=request_params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Inventory Level Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    levels = data.get("inventory_levels", [])
                    if not levels:
                        break
                        
                    for level in levels:
                        item_id = level.get("inventory_item_id")
                        loc_id = level.get("location_id")
                        if item_id: collected_item_ids.add(item_id)
                        
                        composite_id = f"{item_id}_{loc_id}" 
                        
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="inventory_level",
                            payload=level,
                            shopify_object_id=item_id, # Integer for DB column
                            dedupe_id=composite_id # String for unique hash
                        )
                        stats["levels"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                        
                except Exception as e:
                    logger.error(f"Inventory level sync loop failed: {str(e)}")
                    stats["errors"] += 1
                    break
        
        # 3. Sync Inventory Items (Cost)
        if collected_item_ids:
            logger.info(f"Fetching {len(collected_item_ids)} inventory items for cost data...")
            item_stats = await self.fetch_and_ingest_inventory_items(session, integration_id, list(collected_item_ids))
            stats["items"] = item_stats["ingested"]
            stats["errors"] += item_stats["errors"]
            
        return stats

    async def fetch_and_ingest_refunds(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Fetches Shopify Refunds.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        # Shopify doesn't have a top-level /refunds.json. 
        # Refunds are sub-resources of Orders.
        # We fetch all orders updated recently and check for refunds.
        from app.models.shopify.order import ShopifyOrder
        stmt = select(ShopifyOrder.shopify_order_id)
        if start_date:
            stmt = stmt.where(ShopifyOrder.shopify_updated_at >= start_date)
        
        result = await session.execute(stmt)
        order_ids = result.scalars().all()
        
        if not order_ids:
            return stats

        async with httpx.AsyncClient(timeout=60.0) as client:
            for order_id in order_ids:
                url = f"https://{shop_domain}/admin/api/{self.api_version}/orders/{order_id}/refunds.json"
                try:
                    response = await self._make_request(
                        client,
                        url,
                        headers={"X-Shopify-Access-Token": token}
                    )
                    
                    if response.status_code == 200:
                        refunds = response.json().get("refunds", [])
                        for refund in refunds:
                            await self.ingest_raw_object(
                                session=session,
                                integration=integration,
                                object_type="refund",
                                payload=refund
                            )
                            stats["ingested"] += 1
                        # Save progress after each order's refunds to be safe
                        await session.commit()
                    else:
                        logger.warning(f"Failed to fetch refunds for order {order_id}: {response.status_code}")
                except Exception as e:
                    logger.error(f"Error fetching refunds for order {order_id}: {e}")
                    stats["errors"] += 1
        
        return stats

    async def fetch_and_ingest_checkouts(
        self,
        session: AsyncSession,
        integration_id: UUID,
        start_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Fetches Abandoned Checkouts.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/checkouts.json"
            params = {"limit": 250}
            if start_date:
                params["created_at_min"] = start_date.isoformat()

            try:
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Checkouts Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    checkouts = data.get("checkouts", [])
                    if not checkouts:
                        break
                        
                    for checkout in checkouts:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="checkout",
                            payload=checkout
                        )
                        stats["ingested"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Checkouts sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    async def fetch_and_ingest_marketing_events(
        self,
        session: AsyncSession,
        integration_id: UUID
    ) -> Dict[str, int]:
        """
        Fetches Marketing Events.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/marketing_events.json"
            params = {"limit": 250}

            try:
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Marketing Events Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    events = data.get("marketing_events", [])
                    if not events:
                        break
                        
                    for event in events:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="marketing_event",
                            payload=event
                        )
                        stats["ingested"] += 1
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Marketing Events sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    async def fetch_and_ingest_price_rules(
        self,
        session: AsyncSession,
        integration_id: UUID
    ) -> Dict[str, int]:
        """
        Fetches Price Rules and their associated Discount Codes.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"price_rules": 0, "discount_codes": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            base_url = f"https://{shop_domain}/admin/api/{self.api_version}/price_rules.json"
            params = {"limit": 250}

            try:
                while True:
                    response = await self._make_request(
                        client,
                        base_url,
                        headers={"X-Shopify-Access-Token": token},
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Shopify Price Rules Sync Error: {response.status_code} {response.text}")
                        stats["errors"] += 1
                        break
                        
                    data = response.json()
                    rules = data.get("price_rules", [])
                    if not rules:
                        break
                        
                    for rule in rules:
                        rule_id = rule.get("id")
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="price_rule",
                            payload=rule
                        )
                        stats["price_rules"] += 1
                        
                        # Fetch Discount Codes for this rule
                        codes_url = f"https://{shop_domain}/admin/api/{self.api_version}/price_rules/{rule_id}/discount_codes.json"
                        try:
                            codes_resp = await self._make_request(client, codes_url, headers={"X-Shopify-Access-Token": token})
                            if codes_resp.status_code == 200:
                                codes = codes_resp.json().get("discount_codes", [])
                                for code in codes:
                                    # Mix in price_rule_id for ingestion context
                                    code["price_rule_id"] = rule_id
                                    await self.ingest_raw_object(
                                        session=session,
                                        integration=integration,
                                        object_type="discount_code",
                                        payload=code
                                    )
                                    stats["discount_codes"] += 1
                        except Exception as e:
                            logger.error(f"Failed to fetch discount codes for rule {rule_id}: {e}")
                    
                    link_header = response.headers.get("Link")
                    next_page_info = self._get_next_page_info(link_header)
                    if not next_page_info:
                        break
                    params = {"page_info": next_page_info, "limit": 250}
                        
            except Exception as e:
                logger.error(f"Price Rules sync failed: {str(e)}")
                stats["errors"] += 1
                
        return stats

    async def fetch_and_ingest_fulfillments(
        self,
        session: AsyncSession,
        integration_id: UUID,
        order_shopify_ids: List[int]
    ) -> Dict[str, int]:
        """
        Fetches Fulfillments for a list of Order IDs.
        """
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        integration = await session.get(Integration, integration_id)
        shop_domain = integration.metadata_info["shop"]
        
        stats = {"ingested": 0, "errors": 0}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"Fetching fulfillments for {len(order_shopify_ids)} orders...")
            for order_id in order_shopify_ids:
                url = f"https://{shop_domain}/admin/api/{self.api_version}/orders/{order_id}/fulfillments.json"
                try:
                    response = await self._make_request(
                        client,
                        url,
                        headers={"X-Shopify-Access-Token": token}
                    )
                    
                    if response.status_code == 200:
                        fulfillments = response.json().get("fulfillments", [])
                        logger.info(f"Order {order_id}: Found {len(fulfillments)} fulfillments")
                        for fulfillment in fulfillments:
                            await self.ingest_raw_object(
                                session=session,
                                integration=integration,
                                object_type="fulfillment",
                                payload=fulfillment
                            )
                            stats["ingested"] += 1
                    else:
                        logger.warning(f"Failed to fetch fulfillments for order {order_id}: {response.status_code}")
                except Exception as e:
                    logger.error(f"Error fetching fulfillments for order {order_id}: {e}")
                    stats["errors"] += 1
        
        return stats



    async def fetch_and_ingest_locations(self, session: AsyncSession, integration: Integration, token: str, shop_domain: str) -> Dict[str, int]:
        stats = {"ingested": 0, "errors": 0}
        async with httpx.AsyncClient() as client:
            url = f"https://{shop_domain}/admin/api/{self.api_version}/locations.json"
            try:
                resp = await self._make_request(client, url, headers={"X-Shopify-Access-Token": token})
                if resp.status_code == 200:
                    locations = resp.json().get("locations", [])
                    for loc in locations:
                        await self.ingest_raw_object(
                            session=session,
                            integration=integration,
                            object_type="location",
                            payload=loc
                        )
                        stats["ingested"] += 1
                else:
                    logger.error(f"Failed to fetch locations: {resp.text}")
                    stats["errors"] += 1
            except Exception as e:
                logger.error(f"Location sync error: {e}")
                stats["errors"] += 1
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
                    resp = await self._make_request(client, url, headers={"X-Shopify-Access-Token": token}, params=params)
                    if resp.status_code == 200:
                        count = resp.json().get("count", 0)
                        stats[f"{res}_count"] = count
                except Exception as e:
                    logger.error(f"Error fetching count for {res}: {e}")
            
            # Also fetch basic shop info for currency
            try:
                shop_resp = await self._make_request(client, f"https://{shop_domain}/admin/api/{self.api_version}/shop.json", headers={"X-Shopify-Access-Token": token})
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
        created_by: Optional[str] = None,
        shopify_object_id: Optional[int] = None,
        dedupe_id: Optional[str] = None
    ) -> ShopifyRawIngest:
        """
        Canonicalizes and stores the raw JSON payload.
        Idempotent based on (integration_id, dedupe_hash_canonical).
        """
        # 1. Identity
        if shopify_object_id is None:
            # Robust ID extraction
            obj_id_val = payload.get("id") or payload.get("order_id") or payload.get("inventory_item_id")
            
            # Specific check for checkouts which sometimes use 'token' or 'cart_token' 
            # but usually have a numeric ID if it's already an order.
            if obj_id_val is None and object_type == "checkout":
                 obj_id_val = payload.get("checkout_id")
                 
            if isinstance(obj_id_val, int):
                shopify_object_id = obj_id_val
            elif isinstance(obj_id_val, str) and obj_id_val.isdigit():
                 shopify_object_id = int(obj_id_val)
            else:
                # Fallback for weird payloads
                logger.debug(f"No numeric ID found for {object_type} (topic: {topic}).")
        
        if dedupe_id is None:
             # Use the best available unique string
             id_val = payload.get("id") or payload.get("token") or payload.get("checkout_id")
             dedupe_id = str(id_val) if id_val is not None else str(shopify_object_id or uuid4().hex)
        updated_at_str = payload.get("updated_at")
        updated_at = None
        if updated_at_str:
            try:
                # Handle 'Z' suffix which fromisoformat doesn't like in Python < 3.11
                if updated_at_str.endswith('Z'):
                    updated_at_str = updated_at_str.replace('Z', '+00:00')
                updated_at = datetime.fromisoformat(updated_at_str)
            except Exception as e:
                logger.warning(f"Failed to parse shopify updated_at {updated_at_str}: {e}")
        
        # Normalize to UTC Naive for DB
        if updated_at and updated_at.tzinfo:
            updated_at = updated_at.astimezone(timezone.utc).replace(tzinfo=None)

        # 2. Canonical Hash
        # Sort keys to ensure consistent JSON string
        canonical_json = json.dumps(payload, sort_keys=True)
        dedupe_hash = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
        
        # 3. Simple Hash
        dedupe_key = f"{integration.id}_{object_type}_{dedupe_id}_{updated_at}"
        
        # 4. Check Existence (Deduplication)
        stmt = select(ShopifyRawIngest).where(
            ShopifyRawIngest.integration_id == integration.id,
            ShopifyRawIngest.dedupe_hash_canonical == dedupe_hash
        )
        result = await session.execute(stmt)
        existing = result.scalars().first()
        
        if existing:
            return existing

        # 5. Diff Calculation (Activity Feed Specificity)
        # We try to fetch the LATEST ingested record for this object to see what changed
        # This allows the Activity Feed to say "Price changed from $10 to $12"
        diff_summary = {}
        try:
            # Only do this for webhooks to keep backfill fast
            if source == "webhook":
                latest_stmt = select(ShopifyRawIngest).where(
                    ShopifyRawIngest.integration_id == integration.id,
                    ShopifyRawIngest.object_type == object_type,
                    ShopifyRawIngest.shopify_object_id == shopify_object_id
                ).order_by(ShopifyRawIngest.fetched_at.desc()).limit(1)
                
                latest_res = await session.execute(latest_stmt)
                latest_rec = latest_res.scalars().first()
                
                if latest_rec:
                    old_data = latest_rec.payload
                    new_data = payload
                    
                    if object_type == "product":
                        # Check Title
                        if old_data.get("title") != new_data.get("title"):
                            diff_summary["title_changed"] = True
                            diff_summary["old_title"] = old_data.get("title")
                            
                        # Check Variants (Price / Inventory)
                        old_vars = {v["id"]: v for v in old_data.get("variants", [])}
                        new_vars = {v["id"]: v for v in new_data.get("variants", [])}
                        
                        for vid, nv in new_vars.items():
                            ov = old_vars.get(vid)
                            if ov:
                                # Price
                                if ov.get("price") != nv.get("price"):
                                    diff_summary["price_change"] = {
                                        "variant_title": nv.get("title"),
                                        "old": ov.get("price"),
                                        "new": nv.get("price")
                                    }
                                # Inventory
                                old_inv = int(ov.get("inventory_quantity") or 0)
                                new_inv = int(nv.get("inventory_quantity") or 0)
                                if old_inv != new_inv:
                                    diff_summary["inventory_change"] = {
                                        "variant_title": nv.get("title"),
                                        "old": old_inv,
                                        "new": new_inv,
                                        "delta": new_inv - old_inv
                                    }
                                    
                    elif object_type == "order":
                        # Check Financial / Fulfillment Status
                        status_changes = []
                        old_fin = old_data.get("financial_status")
                        new_fin = new_data.get("financial_status")
                        if old_fin != new_fin:
                            status_changes.append({"field": "financial_status", "old": old_fin, "new": new_fin})
                             
                        old_ful = old_data.get("fulfillment_status")
                        new_ful = new_data.get("fulfillment_status")
                        if old_ful != new_ful:
                            status_changes.append({"field": "fulfillment_status", "old": old_ful, "new": new_ful})
                        
                        if status_changes:
                            diff_summary["status_changes"] = status_changes
                            # Keep backward compatibility for now
                            diff_summary["status_change"] = status_changes[-1]

                        # Check Fulfillments / Location Changes
                        old_f = old_data.get("fulfillments", [])
                        new_f = new_data.get("fulfillments", [])
                        if len(old_f) != len(new_f):
                            diff_summary["fulfillment_count_change"] = {"old": len(old_f), "new": len(new_f)}
                        
                        # Detect Location change in recent fulfillment
                        if new_f:
                            latest_new_loc = new_f[-1].get("location_id")
                            latest_old_loc = old_f[-1].get("location_id") if old_f else None
                            if latest_new_loc != latest_old_loc:
                                diff_summary["location_change"] = {"old": latest_old_loc, "new": latest_new_loc}

        except Exception as e:
            logger.warning(f"Failed to compute diff for {object_type} {shopify_id}: {e}")

        # 6. Create
        ingest_record = ShopifyRawIngest(
            integration_id=integration.id,
            company_id=integration.company_id,
            object_type=object_type,
            shopify_object_id=shopify_object_id,
            shopify_updated_at=updated_at,
            dedupe_key=dedupe_key,
            dedupe_hash_canonical=dedupe_hash,
            source=source,
            topic=topic or f"{object_type}/backfill",
            api_version=self.api_version,
            payload=payload,
            diff_summary=diff_summary,
            processing_status="pending",
            created_by=created_by,
            updated_by=created_by
        )
        
        session.add(ingest_record)
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
                    from urllib.parse import parse_qs, urlparse
                    parsed = urlparse(url_part)
                    return parse_qs(parsed.query)['page_info'][0]
                except Exception:
                    return None
        return None

    def _inject_range_into_shopify_ql(self, query: str, start_date: Optional[datetime], end_date: Optional[datetime]) -> str:
        """
        Injects SINCE and UNTIL clauses into a ShopifyQL query using regex.
        Ensures clauses are placed correctly after the FROM table name.
        """
        import re
        
        # 1. Prepare snippets
        since_val = start_date.strftime('%Y-%m-%d') if start_date else None
        until_val = end_date.strftime('%Y-%m-%d') if end_date else None
        
        if not since_val and not until_val:
            return query

        # 2. Add snippets to list
        clauses = []
        if since_val: clauses.append(f"SINCE {since_val}")
        if until_val: clauses.append(f"UNTIL {until_val}")
        injection = " " + " ".join(clauses)

        # 3. Use Regex to find the FROM table_name pattern
        # ShopifyQL tables are usually: sales, orders, customers, etc.
        # Pattern: FROM <table_name>
        pattern = re.compile(r'(FROM\s+[a-zA-Z0-9_]+)', re.IGNORECASE)
        
        if pattern.search(query):
            # Insert right after the table name
            return pattern.sub(rf'\1{injection}', query)
        
        # Fallback for truly edge-case queries (e.g. missing FROM or non-standard)
        return f"{query}{injection}"

    async def verify_integration_integrity(self, session: AsyncSession, integration_id: UUID) -> Dict[str, Any]:
        """
        Performs a comprehensive health check on the Shopify integration.
        Validates that we have a complete one-on-one replica of the Shopify store.
        Checks ALL Shopify tables: operational data + analytics data.
        """
        from datetime import datetime, timedelta

        from app.models.shopify.address import ShopifyAddress
        from app.models.shopify.analytics import (
            ShopifyAnalyticsSnapshot,
            ShopifyReport,
            ShopifyReportData,
        )
        from app.models.shopify.checkout import ShopifyCheckout
        from app.models.shopify.customer import ShopifyCustomer
        from app.models.shopify.discount import ShopifyDiscountCode, ShopifyPriceRule
        from app.models.shopify.financials import (
            ShopifyBalanceTransaction,
            ShopifyDispute,
            ShopifyPayout,
        )
        from app.models.shopify.fulfillment import ShopifyFulfillment
        from app.models.shopify.inventory import (
            ShopifyInventoryItem,
            ShopifyInventoryLevel,
            ShopifyLocation,
        )
        from app.models.shopify.marketing import ShopifyMarketingEvent
        from app.models.shopify.metrics import ShopifyDailyMetric
        from app.models.shopify.order import ShopifyOrder
        from app.models.shopify.product import (
            ShopifyProduct,
            ShopifyProductImage,
            ShopifyProductVariant,
        )
        from app.models.shopify.raw_ingest import ShopifyRawIngest
        from app.models.shopify.refund import ShopifyRefund
        from app.models.shopify.transaction import ShopifyTransaction
        
        report = {
            "integration_id": str(integration_id),
            "status": "Healthy",
            "issues": [],
            "warnings": [],
            "stats": {},
            "webhook_status": "unknown",
            "last_activity": None,
            "data_completeness": {}
        }
        
        try:
            # 1. Fetch Integration
            integration = await session.get(Integration, integration_id)
            if not integration:
                report["status"] = "Critical"
                report["issues"].append("Integration record not found")
                return report
            
            # 2. Check OAuth Token Validity
            try:
                shop = integration.metadata_info.get("shop")
                if not shop:
                    report["status"] = "Critical"
                    report["issues"].append("Shop domain missing from integration metadata")
                    return report
                
                # Decrypt and verify token
                encrypted_token = integration.credentials.get("access_token")
                if not encrypted_token:
                    report["status"] = "Critical"
                    report["issues"].append("Access token missing - reconnection required")
                    return report
                
                access_token = shopify_oauth_service.decrypt_token(encrypted_token)
                
                # Test token with a lightweight API call
                async with httpx.AsyncClient() as client:
                    test_url = f"https://{shop}/admin/api/{self.api_version}/shop.json"
                    headers = {"X-Shopify-Access-Token": access_token}
                    resp = await client.get(test_url, headers=headers, timeout=10.0)
                    
                    if resp.status_code == 401:
                        report["status"] = "Critical"
                        report["issues"].append("OAuth token is invalid or expired - reconnection required")
                        return report
                    elif resp.status_code != 200:
                        report["warnings"].append(f"Shopify API returned status {resp.status_code}")
                
                report["stats"]["oauth_status"] = "valid"
                
            except Exception as token_error:
                report["status"] = "Critical"
                report["issues"].append(f"OAuth token validation failed: {str(token_error)}")
                return report
            
            # 3. Check Webhook Status
            try:
                async with httpx.AsyncClient() as client:
                    webhooks_url = f"https://{shop}/admin/api/{self.api_version}/webhooks.json"
                    headers = {"X-Shopify-Access-Token": access_token}
                    resp = await client.get(webhooks_url, headers=headers, timeout=10.0)
                    
                    if resp.status_code == 200:
                        webhooks = resp.json().get("webhooks", [])
                        report["stats"]["registered_webhooks"] = len(webhooks)
                        
                        # Expected webhook topics
                        expected_topics = [
                            "orders/create", "orders/updated", "orders/delete",
                            "products/create", "products/update", "products/delete",
                            "customers/create", "customers/updated", "customers/delete",
                            "inventory_levels/update", "locations/update",
                            "checkouts/create", "checkouts/update",
                            "fulfillments/create", "fulfillments/update",
                            "price_rules/create", "price_rules/update", "price_rules/delete",
                            "marketing_events/create", "marketing_events/update",
                            "shopify_payments/payouts/create",
                            "shopify_payments/disputes/create", "shopify_payments/disputes/updated"
                        ]
                        
                        registered_topics = [w["topic"] for w in webhooks]
                        missing_topics = [t for t in expected_topics if t not in registered_topics]
                        
                        if missing_topics:
                            report["warnings"].append(f"Missing webhooks: {', '.join(missing_topics)}")
                            report["webhook_status"] = "partial"
                        else:
                            report["webhook_status"] = "active"
                    else:
                        report["warnings"].append("Could not verify webhook status")
                        report["webhook_status"] = "unknown"
                        
            except Exception as webhook_error:
                logger.error(f"Webhook verification failed: {webhook_error}")
                report["warnings"].append("Webhook verification failed")
                report["webhook_status"] = "unknown"
            
            # 4. Check Recent Activity (ShopifyRawIngest)
            stmt = select(ShopifyRawIngest).where(
                ShopifyRawIngest.integration_id == integration_id
            ).order_by(ShopifyRawIngest.fetched_at.desc()).limit(1)
            
            latest_activity = (await session.execute(stmt)).scalars().first()
            if latest_activity:
                report["last_activity"] = latest_activity.fetched_at.isoformat()
                report["stats"]["last_activity_source"] = latest_activity.source
                
                # Check if activity is recent (within 48 hours)
                time_since_activity = datetime.now(timezone.utc) - latest_activity.fetched_at.replace(tzinfo=timezone.utc)
                if time_since_activity > timedelta(hours=48):
                    report["warnings"].append(f"No activity in {time_since_activity.days} days - sync may be stalled")
            else:
                report["warnings"].append("No ingestion activity found - initial sync may not have run")
            
            # 5. Check Core Data Tables - One-on-One Replica Validation
            data_checks = []
            
            # Orders
            orders_count = (await session.execute(
                select(func.count(ShopifyOrder.id)).where(ShopifyOrder.integration_id == integration_id)
            )).scalar_one() or 0
            data_checks.append(("orders", orders_count))
            report["data_completeness"]["orders"] = orders_count
            
            # Products
            products_count = (await session.execute(
                select(func.count(ShopifyProduct.id)).where(ShopifyProduct.integration_id == integration_id)
            )).scalar_one() or 0
            data_checks.append(("products", products_count))
            report["data_completeness"]["products"] = products_count
            
            # Product Variants
            variants_count = (await session.execute(
                select(func.count(ShopifyProductVariant.id)).where(ShopifyProductVariant.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["product_variants"] = variants_count
            
            # Product Images
            images_count = (await session.execute(
                select(func.count(ShopifyProductImage.id)).where(ShopifyProductImage.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["product_images"] = images_count
            
            # Customers
            customers_count = (await session.execute(
                select(func.count(ShopifyCustomer.id)).where(ShopifyCustomer.integration_id == integration_id)
            )).scalar_one() or 0
            data_checks.append(("customers", customers_count))
            report["data_completeness"]["customers"] = customers_count
            
            # Addresses
            addresses_count = (await session.execute(
                select(func.count(ShopifyAddress.id)).where(ShopifyAddress.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["addresses"] = addresses_count
            
            # Locations
            locations_count = (await session.execute(
                select(func.count(ShopifyLocation.id)).where(ShopifyLocation.integration_id == integration_id)
            )).scalar_one() or 0
            data_checks.append(("locations", locations_count))
            report["data_completeness"]["locations"] = locations_count
            
            # Inventory Levels
            inventory_levels_count = (await session.execute(
                select(func.count(ShopifyInventoryLevel.id)).where(ShopifyInventoryLevel.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["inventory_levels"] = inventory_levels_count
            
            # Inventory Items
            inventory_items_count = (await session.execute(
                select(func.count(ShopifyInventoryItem.id)).where(ShopifyInventoryItem.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["inventory_items"] = inventory_items_count
            
            # Transactions
            transactions_count = (await session.execute(
                select(func.count(ShopifyTransaction.id)).where(ShopifyTransaction.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["transactions"] = transactions_count
            
            # Refunds
            refunds_count = (await session.execute(
                select(func.count(ShopifyRefund.id)).where(ShopifyRefund.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["refunds"] = refunds_count
            
            # Financials
            payouts_count = (await session.execute(
                select(func.count(ShopifyPayout.id)).where(ShopifyPayout.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["payouts"] = payouts_count
            
            disputes_count = (await session.execute(
                select(func.count(ShopifyDispute.id)).where(ShopifyDispute.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["disputes"] = disputes_count
            
            balance_transactions_count = (await session.execute(
                select(func.count(ShopifyBalanceTransaction.id)).where(ShopifyBalanceTransaction.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["balance_transactions"] = balance_transactions_count
            
            # Analytics Tables
            reports_count = (await session.execute(
                select(func.count(ShopifyReport.id)).where(ShopifyReport.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["reports"] = reports_count
            
            report_data_count = (await session.execute(
                select(func.count(ShopifyReportData.id)).where(ShopifyReportData.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["report_data"] = report_data_count
            
            analytics_snapshots_count = (await session.execute(
                select(func.count(ShopifyAnalyticsSnapshot.id)).where(ShopifyAnalyticsSnapshot.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["analytics_snapshots"] = analytics_snapshots_count
            
            daily_metrics_count = (await session.execute(
                select(func.count(ShopifyDailyMetric.id)).where(ShopifyDailyMetric.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["daily_metrics"] = daily_metrics_count

            # New Models
            fulfillments_count = (await session.execute(
                select(func.count(ShopifyFulfillment.id)).where(ShopifyFulfillment.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["fulfillments"] = fulfillments_count

            checkouts_count = (await session.execute(
                select(func.count(ShopifyCheckout.id)).where(ShopifyCheckout.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["checkouts"] = checkouts_count

            marketing_events_count = (await session.execute(
                select(func.count(ShopifyMarketingEvent.id)).where(ShopifyMarketingEvent.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["marketing_events"] = marketing_events_count

            price_rules_count = (await session.execute(
                select(func.count(ShopifyPriceRule.id)).where(ShopifyPriceRule.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["price_rules"] = price_rules_count
            
            discount_codes_count = (await session.execute(
                select(func.count(ShopifyDiscountCode.id)).where(ShopifyDiscountCode.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["discount_codes"] = discount_codes_count
            
            # Raw Ingest (for completeness)
            raw_ingest_count = (await session.execute(
                select(func.count(ShopifyRawIngest.id)).where(ShopifyRawIngest.integration_id == integration_id)
            )).scalar_one() or 0
            report["data_completeness"]["raw_ingest"] = raw_ingest_count
            
            # 6. Analyze Data Completeness
            # Check if we have at least SOME data in core tables
            core_tables_empty = all(count == 0 for name, count in data_checks)
            
            if core_tables_empty and latest_activity:
                # We have activity but no data - possible refinement issue
                report["status"] = "Warning"
                report["warnings"].append("Data ingestion detected but no refined data in core tables - refinement may be failing")
            elif core_tables_empty and not latest_activity:
                # Fresh connection - this is normal
                report["status"] = "Healthy"
                report["warnings"].append("Fresh connection - initial sync has not been triggered yet")
            
            # 7. Check Integration Status
            if integration.status == IntegrationStatus.INACTIVE:
                report["status"] = "Critical"
                report["issues"].append("Integration is marked as INACTIVE")
            elif integration.status == IntegrationStatus.ERROR:
                report["status"] = "Critical"
                report["issues"].append("Integration is in ERROR state")
                if integration.error_message:
                    report["issues"].append(f"Error: {integration.error_message}")
            
            # 8. Final Status Determination
            if report["issues"]:
                report["status"] = "Critical"
            elif report["warnings"] and report["status"] != "Critical":
                report["status"] = "Warning"
            
            return report
            
        except Exception as e:
            logger.error(f"Integrity verification failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "integration_id": str(integration_id),
                "status": "Error",
                "issues": [f"Verification failed: {str(e)}"],
                "stats": {}
            }

shopify_sync_service = ShopifySyncService()
