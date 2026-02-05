import asyncio
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import httpx
from loguru import logger
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.integration import Integration
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.inventory import ShopifyInventoryLevel
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.product import ShopifyProduct
from app.services.shopify.oauth_service import shopify_oauth_service


class ShopifyReconciliationService:
    """
    Module 7: Zero-Drift Resilience Engine.
    Periodically compares Shopify Remote State vs. Local DB and auto-heals discrepancies.
    """
    
    def __init__(self):
        self.api_version = "2024-01"

    async def _update_status(self, session: AsyncSession, integration: Integration, message: str, step: str = "reconciling", progress: int = 0):
        """Helper to broadcast status to DB for frontend polling."""
        try:
            # Re-fetch to avoid stale object state
            current_integration = await session.get(Integration, integration.id)
            if not current_integration: return
            
            meta = current_integration.metadata_info or {}
            if "sync_stats" not in meta: meta["sync_stats"] = {}
            
            meta["sync_stats"].update({
                "current_step": step,
                "message": message,
                "progress": progress,
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
            
            current_integration.metadata_info = meta
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(current_integration, "metadata_info")
            session.add(current_integration)
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to update status: {e}")

    async def reconcile_integration(self, session: AsyncSession, integration: Integration):
        """
        Main entry point. Audits all core resources for an integration.
        """
        # Prevent MissingGreenlet errors on subsequent attribute access after _update_status commits
        session.expire_on_commit = False
        
        logger.info(f"🛡️ Starting Reconciliation for Integration {integration.id}...")
        
        # Pre-fetch context before _update_status calls commit() which expires the instance
        shop = integration.metadata_info.get("shop")
        integration_id = integration.id
        
        await self._update_status(session, integration, "Initializing Security Audit...", progress=5)
        
        # Integration instance is now expired due to commit in _update_status.
        # We use integration_id for subsequent lookups.
        
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        
        if not token or not shop:
            logger.error(f"❌ Missing credentials for Integration {integration_id}")
            await self._update_status(session, integration, "Audit Failed: Missing Credentials", step="error")
            return

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # 1. Reconcile Orders (The Truth)
                await self._update_status(session, integration, "Auditing Order Integrity...", progress=20)
                await self._reconcile_orders(session, client, integration, shop, token)
                
                # 2. Reconcile Products (The Assets)
                await self._update_status(session, integration, "Verifying Product Catalog...", progress=50)
                await self._reconcile_products(session, client, integration, shop, token)
                
                # 3. Reconcile Inventory (The Stock)
                await self._update_status(session, integration, "Audit: Inventory Levels...", progress=80)
                await self._reconcile_inventory(session, client, integration, shop, token)
                
                # 4. Reconcile Customers (The People)
                await self._update_status(session, integration, "Verifying Customer Database...", progress=90)
                await self._reconcile_customers(session, client, integration, shop, token)
            
            # 5. Final Stats Tally (Audit Complete)
            # Re-fetch integration to ensure we have latest metadata
            current_integration = await session.get(Integration, integration_id)
            if current_integration:
                from app.models.shopify.inventory import ShopifyInventoryLevel
                from app.models.shopify.order import ShopifyOrder
                from app.models.shopify.product import ShopifyProduct
                
                # Count refined orders
                orders_count = (await session.execute(
                    select(func.count(ShopifyOrder.id)).where(ShopifyOrder.integration_id == integration_id)
                )).scalar_one() or 0
                
                # Count refined products
                products_count = (await session.execute(
                    select(func.count(ShopifyProduct.id)).where(ShopifyProduct.integration_id == integration_id)
                )).scalar_one() or 0
                
                # Count total inventory
                inventory_count = (await session.execute(
                    select(func.sum(ShopifyInventoryLevel.available)).where(ShopifyInventoryLevel.integration_id == integration_id)
                )).scalar_one() or 0

                meta = current_integration.metadata_info or {}
                if "sync_stats" not in meta: meta["sync_stats"] = {}
                
                meta["sync_stats"].update({
                    "orders_count": orders_count,
                    "products_count": products_count,
                    "inventory_count": int(inventory_count or 0),
                    "current_step": "complete",
                    "message": "Integrity Verified",
                    "progress": 100,
                    "last_updated": datetime.now(timezone.utc).isoformat()
                })
                
                current_integration.metadata_info = meta
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(current_integration, "metadata_info")
                session.add(current_integration)
                await session.commit()

            logger.info(f"✅ Reconciliation Complete for {integration_id}")
            
        except Exception as e:
            await session.rollback() # CRITICAL: Poisoned session recovery
            logger.error(f"Reconciliation Failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Re-fetch to allow status update
            integration = await session.get(Integration, integration_id)
            if integration:
                await self._update_status(session, integration, "Audit Failed. Try 'Reconnect'.", step="error")

    async def _reconcile_orders(self, session: AsyncSession, client: httpx.AsyncClient, integration: Integration, shop: str, token: str):
        """
        Fetches ALL generic Order IDs + UpdatedAt from Shopify and compares with DB.
        """
        integration_id = integration.id
        logger.info("🔍 Auditing Orders...")
        
        remote_map, token = await self._fetch_remote_map(session, client, integration, shop, token, "orders")
        
        if not remote_map and token is None:
             return
        
        # 2. Fetch Local Map {admin_graphql_api_id -> local_db_record}
        stmt = select(ShopifyOrder.shopify_order_id, ShopifyOrder.shopify_updated_at).where(
            ShopifyOrder.integration_id == integration_id
        )
        result = await session.execute(stmt)
        # normalize to UTC aware datetime for comparison if needed, but we often store naive or various.
        # Best to ensure we are comparing apples to apples.
        local_rows = result.all()
        logger.info(f"DEBUG: Local search finished for orders. Found {len(local_rows)} items")
        local_map = {row[0]: row[1] for row in local_rows}
        
        # 3. Diff & Heal
        if remote_map or local_map:
             await self._diff_and_heal(session, integration, "orders", remote_map, local_map)

    async def _reconcile_products(self, session: AsyncSession, client: httpx.AsyncClient, integration: Integration, shop: str, token: str):
        integration_id = integration.id
        logger.info("🔍 Auditing Products...")
        remote_map, token = await self._fetch_remote_map(session, client, integration, shop, token, "products")
        
        if not remote_map and token is None:
             return
        
        stmt = select(ShopifyProduct.shopify_product_id, ShopifyProduct.shopify_updated_at).where(
            ShopifyProduct.integration_id == integration_id
        )
        result = await session.execute(stmt)
        # Note: Product model now has shopify_updated_at for consistent drift detection.
        local_rows = result.all()
        logger.info(f"DEBUG: Local search finished for products. Found {len(local_rows)} products")
        local_map = {row[0]: row[1] for row in local_rows}
        
        if remote_map or local_map:
            await self._diff_and_heal(session, integration, "products", remote_map, local_map)

    async def _reconcile_inventory(self, session: AsyncSession, client: httpx.AsyncClient, integration: Integration, shop: str, token: str):
        """
        Subtle complexity: InventoryLevels don't have a simple 'updated_at' on the listing often.
        And fetching ALL levels requires iterating location_ids.
        Stratergy:
        1. Fetch all Location IDs.
        2. For each location, fetch all levels.
        3. Compare [inventory_item_id]-[location_id] composite key.
        """
        integration_id = integration.id
        logger.info("🔍 Auditing Inventory...")
        
        # 1. Fetch Locations (Remote)
        # We need active locations to query levels
        url = f"https://{shop}/admin/api/{self.api_version}/locations.json"
        
        locations = []
        try:
             resp = await client.get(url, headers={"X-Shopify-Access-Token": token})
             if resp.status_code == 200:
                 locations = resp.json().get("locations", [])
        except Exception as e:
            logger.error(f"Failed to fetch locations for inventory audit: {e}")
            return

        remote_inventory = {} # Key: "{inventory_item_id}_{location_id}", Value: updated_at (from ISO)
        
        # 2. Fetch Levels per Location
        for loc in locations:
            loc_id = loc["id"]
            # Fetch levels
            # Inventory Levels API doesn't support 'updated_at' filtering well in older versions, 
            # but usually updated_at is present in the object response.
            # Warning: Inventory Levels can be HUGE. 
            # We will use the same pagination logic manually here or adapt _fetch_remote_map logic if generalized...
            # But _fetch_remote_map relies on generic 'updated_at' and single resource endpoints.
            # Inventory Levels endpoint is /inventory_levels.json?location_ids=X
            
            # Simplified Fetch Loop for this location
            # (In a real massive store, we'd parallelize this)
            params = {"location_ids": loc_id, "limit": 250}
            url = f"https://{shop}/admin/api/{self.api_version}/inventory_levels.json"
            
            while True:
                resp = await client.get(url, headers={"X-Shopify-Access-Token": token}, params=params)
                if resp.status_code == 429:
                     await asyncio.sleep(float(resp.headers.get("Retry-After", 2.0)))
                     continue
                if resp.status_code != 200:
                     logger.error(f"Error fetching inventory for loc {loc_id}: {resp.status_code}")
                     break
                
                data = resp.json()
                items = data.get("inventory_levels", [])
                
                for item in items:
                    # Key: item_id + loc_id
                    key = f"{item['inventory_item_id']}_{item['location_id']}"
                    # InventoryLevel object has 'updated_at'
                    remote_inventory[key] = item.get("updated_at")
                
                # Pagination
                link = resp.headers.get("Link")
                next_link = self._parse_next_link(link)
                if not next_link: break
                url = next_link
                params = {} # Params in url

        # 3. Fetch Local State
        # We need composite key map
        stmt = select(ShopifyInventoryLevel.shopify_inventory_item_id, ShopifyInventoryLevel.shopify_location_id, ShopifyInventoryLevel.shopify_updated_at).where(
            ShopifyInventoryLevel.integration_id == integration_id
        )
        result = await session.execute(stmt)
        local_rows = result.all()
        
        local_inventory = {}
        for row in local_rows:
            key = f"{row[0]}_{row[1]}"
            local_inventory[key] = row[2] # datetime
            
        # 4. Custom Diff & Heal (Composite Key Support)
        # We cannot use _diff_and_heal directly because it expects integer IDs.
        # We'll adapt the logic inline here.
        
        remote_keys = set(remote_inventory.keys())
        local_keys = set(local_inventory.keys())
        
        missing = remote_keys - local_keys
        stale = []
        
        common = remote_keys.intersection(local_keys)
        for key in common:
            r_ts_str = remote_inventory[key]
            l_ts = local_inventory[key]
            
            if not l_ts or not r_ts_str: 
                # Safety
                continue
                
            try:
                if r_ts_str.endswith('Z'): r_ts_str = r_ts_str[:-1] + '+00:00'
                r_ts = datetime.fromisoformat(r_ts_str)
                if r_ts.tzinfo is None: r_ts = r_ts.replace(tzinfo=timezone.utc)
                if l_ts.tzinfo is None: l_ts = l_ts.replace(tzinfo=timezone.utc)
                
                if abs((r_ts - l_ts).total_seconds()) > 2.0:
                    stale.append(key)
            except:
                stale.append(key) # Parse error -> assume stale
        
        # Heal Missing + Stale
        to_heal = list(missing.union(set(stale)))
        
        if to_heal:
            logger.info(f"⚡ Healing {len(to_heal)} inventory records...")
            # For inventory, "Healing" means re-fetching the specific item?
            # Inventory API doesn't allow fetching by ID list easily (it uses item_ids or location_ids).
            # Strategy: Group by inventory_item_id and fetch batches.
            
            # Extract item_ids from keys "item_loc"
            item_ids_to_fetch = set()
            for k in to_heal:
                item_ids_to_fetch.add(int(k.split('_')[0]))
            
            # Batch fetch by inventory_item_ids
            all_item_ids = list(item_ids_to_fetch)
            chunk_size = 50
            for i in range(0, len(all_item_ids), chunk_size):
                 chunk = all_item_ids[i:i+chunk_size]
                 ids_str = ",".join(map(str, chunk))
                 
                 # Fetch levels for these items (across ALL locations)
                 # /admin/api/2024-01/inventory_levels.json?inventory_item_ids=...
                 # This is efficient.
                 url = f"https://{shop}/admin/api/{self.api_version}/inventory_levels.json"
                 params = {"inventory_item_ids": ids_str}
                 
                 try:
                     resp = await client.get(url, headers={"X-Shopify-Access-Token": token}, params=params)
                     if resp.status_code == 200:
                         levels = resp.json().get("inventory_levels", [])
                         # Ingest
                         from app.services.shopify.sync_service import (
                             shopify_sync_service,
                         )
                         for lvl in levels:
                             # We must treat this as a virtual 'inventory_level' object for the sync service
                             # or call a specific method if exists.
                             # Assuming ingest_raw_object handles "inventory_level"
                             await shopify_sync_service.ingest_raw_object(session, integration, "inventory_level", lvl)
                         
                         # Trigger refinement? 
                         # Usually refinement is async. We can manually trigger or trust background worker.
                         # For "Reconciliation", immediate is better.
                         from app.services.shopify.refinement_service import (
                             shopify_refinement_service,
                         )
                         await shopify_refinement_service.process_pending_records(session, integration.id)
                         
                 except Exception as e:
                     logger.error(f"Failed inventory heal batch: {e}")

        # Zombies (Local but not Remote)
        # Be careful: InventoryLevels are tricky. If an item is stocked at Loc A locally, but removed from Loc A remotely, it disappears from API?
        # Yes.
        zombies = local_keys - remote_keys
        if zombies:
             logger.info(f"🧟 Pruning {len(zombies)} zombie inventory levels...")
             # Delete from DB
             # Composite delete is hard with sqlmodel simple delete.
             # We iterate? Or complex delete.
             # For safety and speed, iterate batch.
             for z_key in zombies:
                 parts = z_key.split('_')
                 # parts[0] = item_id, parts[1] = location_id
                 target_item = int(parts[0])
                 target_loc = int(parts[1])
                 
                 stmt = select(ShopifyInventoryLevel).where(
                     ShopifyInventoryLevel.integration_id == integration.id,
                     ShopifyInventoryLevel.shopify_inventory_item_id == target_item,
                     ShopifyInventoryLevel.shopify_location_id == target_loc
                 )
                 res = await session.execute(stmt)
                 if z_obj := res.scalar_one_or_none():
                     await session.delete(z_obj)
             
             await session.commit()

    async def _reconcile_customers(self, session: AsyncSession, client: httpx.AsyncClient, integration: Integration, shop: str, token: str):
        """
        Audits Customer records.
        """
        integration_id = integration.id
        logger.info("🔍 Auditing Customers...")
        
        # 1. Fetch Remote State (IDs + Timestamps)
        # Reuse _fetch_remote_map
        remote_map, token = await self._fetch_remote_map(session, client, integration, shop, token, "customers")
        
        if not remote_map and token is None:
             return

        # 2. Fetch Local State
        stmt = select(ShopifyCustomer.shopify_customer_id, ShopifyCustomer.shopify_updated_at).where(
            ShopifyCustomer.integration_id == integration.id
        )
        result = await session.execute(stmt)
        local_map = {row[0]: row[1] for row in result.all()}
        
        # 3. Diff and Heal
        await self._diff_and_heal(session, integration, "customers", remote_map, local_map)
        
        logger.info(f"✅ Customer Audit Complete for {integration.id}")

    async def _fetch_remote_map(self, session: AsyncSession, client: httpx.AsyncClient, integration: Integration, shop: str, token: str, resource: str) -> Tuple[Dict[int, str], str]:
        """
        Fetches all IDs and updated_at from Shopify for comparison.
        Handles Link header pagination and rate limits (429).
        Refreshes token on 401.
        """
        logger.info(f"DEBUG: _fetch_remote_map starting for {resource}")
        remote_map = {}
        # Basic params
        url = f"https://{shop}/admin/api/2024-04/{resource}.json"
        base_params = {"fields": "id,updated_at", "limit": 250}
        
        # Resource-specific filtering
        if resource == "orders":
            base_params["status"] = "any"

        params = base_params.copy()
        headers = {"X-Shopify-Access-Token": token}

        page_count = 0
        while True:
            page_count += 1
            # Retry loop for this page
            resp = None
            retries = 3
            backoff = 2.0
            
            for attempt in range(retries):
                try:
                    logger.info(f"DEBUG: Fetching {resource} page {page_count}: {url} (Attempt {attempt+1})")
                    resp = await client.get(url, headers=headers, params=params)
                    
                    # 429: Rate Limit
                    if resp.status_code == 429:
                        retry_after = float(resp.headers.get("Retry-After", backoff))
                        logger.warning(f"Rate Limit 429. Sleeping {retry_after}s")
                        await asyncio.sleep(retry_after)
                        backoff *= 2 # Exponential backoff just in case
                        continue
                    
                    # 401: Token Expired
                    if resp.status_code == 401:
                        logger.warning(f"Token 401 for {resource}. Refreshing...")
                        try:
                            # Re-fetch fresh token
                            new_token = await shopify_oauth_service.get_access_token(integration.id, session)
                            token = new_token
                            headers["X-Shopify-Access-Token"] = token
                            
                            # Retry immediately with new token
                            logger.info("DEBUG: Retrying with new token...")
                            resp = await client.get(url, headers=headers, params=params)
                        except Exception as e:
                            logger.error(f"Token refresh failed: {e}")
                            break
                    
                    # Success or other error - break retry loop
                    break
                except Exception as req_err:
                     logger.error(f"Request error: {req_err}")
                     if attempt == retries - 1:
                         raise
                     await asyncio.sleep(backoff)
            
            if not resp or resp.status_code != 200:
                logger.error(f"Failed to fetch {resource}: {resp.status_code if resp else 'No Resp'} {resp.text if resp else ''}")
                if resp and resp.status_code == 401:
                     return {}, None
                break
            
            # Process Page
            data = resp.json()
            items = data.get(resource, [])
            logger.info(f"DEBUG: Got {len(items)} {resource}")
            for item in items:
                # Force cast to int to prevent bigint vs varchar comparison errors in DB
                try:
                    remote_map[int(item["id"])] = item["updated_at"]
                except (KeyError, ValueError, TypeError):
                    logger.warning(f"Skipping item with invalid ID/Timestamp: {item}")
            
            # Pagination
            link_header = resp.headers.get("Link")
            next_link = self._parse_next_link(link_header)
            
            if not next_link:
                break
                
            # Prepare next page
            url = next_link
            params = {} 
        
        logger.info(f"DEBUG: _fetch_remote_map finished for {resource}. Total: {len(remote_map)}")
        return remote_map, token

    def _parse_next_link(self, link_header: Optional[str]) -> Optional[str]:
        """
        Robustly parses the Link header to find the 'next' page URL.
        Example Header:
        <https://...>; rel="previous", <https://...>; rel="next"
        """
        if not link_header:
            return None
            
        # Split by comma to handle multiple links
        links = link_header.split(',')
        for link in links:
            # Look for rel="next"
            if 'rel="next"' in link:
                # Extract URL between brackets <...>
                match = re.search(r'<([^>]+)>', link)
                if match:
                    return match.group(1)
        return None

    async def _diff_and_heal(self, session: AsyncSession, integration: Integration, resource_type: str, remote_map: Dict[int, str], local_map: Dict[int, datetime]):
        """
        The Healer:
        1. Missing locally -> Trigger Fetch
        2. Stale locally -> Trigger Fetch (Drift Detection)
        3. Zombie (In local, not remote) -> Delete
        """
        remote_ids = set(remote_map.keys())
        local_ids = set(local_map.keys())
        
        # 1. Missing (Pure Existence Check)
        missing_ids = list(remote_ids - local_ids)
        
        # 2. Stale (Deep Integrity Check)
        stale_ids = []
        common_ids = remote_ids.intersection(local_ids)
        
        for pid in common_ids:
            remote_ts_str = remote_map[pid]
            local_ts = local_map[pid]
            
            if not local_ts:
                # If local has no timestamp, it's stale/incomplete
                stale_ids.append(pid)
                continue

            # Normalize Remote (ISO String) to Datetime
            try:
                # Handle Python 3.9 limitation with 'Z'
                if remote_ts_str.endswith('Z'):
                    remote_ts_str = remote_ts_str[:-1] + '+00:00'
                    
                # Shopify ISO 8601: "2024-01-01T12:00:00-05:00" or Z
                remote_ts = datetime.fromisoformat(remote_ts_str)
                
                # Ensure UTC
                if remote_ts.tzinfo is None:
                    remote_ts = remote_ts.replace(tzinfo=timezone.utc)
                if local_ts.tzinfo is None:
                    local_ts = local_ts.replace(tzinfo=timezone.utc)
                
                # Compare with small buffer (1 second) to allow for DB precision loss
                diff = abs((remote_ts - local_ts).total_seconds())
                if diff > 1.0:
                    stale_ids.append(pid)
            except Exception as e:
                # If parse fails, assume stale to be safe
                logger.warning(f"Timestamp parse error for {pid}: {e}")
                stale_ids.append(pid)

        # Combine Missing + Stale for Healing
        items_to_heal = list(set(missing_ids + stale_ids))
        
        if items_to_heal:
            logger.warning(f"⚠️ Found {len(items_to_heal)} Drifting {resource_type} (Missing: {len(missing_ids)}, Stale: {len(stale_ids)}). Healing...")
            await self._heal_batch(session, integration, resource_type, items_to_heal)
            
        # 3. Zombies (Deleted in Shopify but present locally)
        zombie_ids = list(local_ids - remote_ids)
        if zombie_ids:
            logger.warning(f"🧟 Found {len(zombie_ids)} ZOMBIE {resource_type}. Deleting...")
            await self._delete_zombies(session, integration, resource_type, zombie_ids)

    async def _heal_batch(self, session: AsyncSession, integration: Integration, resource_type: str, ids: List[int]):
        """
        Triggers a specific fetch for these IDs.
        """
        integration_id = integration.id
        if not ids:
            return
            
        chunk_size = 50 
        for i in range(0, len(ids), chunk_size):
            chunk = ids[i:i+chunk_size]
            ids_str = ",".join(map(str, chunk))
            
            logger.info(f"🚑 Healing batch {i}-{i+chunk_size} for {resource_type}...")
            
            token = await shopify_oauth_service.get_access_token(integration_id, session)
            # Use shop name from metadata (cached)
            shop = integration.metadata_info.get("shop") if integration.metadata_info else None
            # If integration was expired, shop might be None. Re-fetch if needed.
            if not shop:
                integration = await session.get(Integration, integration_id)
                shop = integration.metadata_info.get("shop")
            
            # Use raw ingest pipeline
            async with httpx.AsyncClient() as client:
                url = f"https://{shop}/admin/api/{self.api_version}/{resource_type}.json"
                try:
                    resp = await client.get(url, headers={"X-Shopify-Access-Token": token}, params={"ids": ids_str, "status": "any"})
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get(resource_type, [])
                        
                        # Check for partial failure (Zombie Detection in Heal Batch)
                        # Identify IDs we requested but didn't get back
                        healed_ids = {int(item["id"]) for item in items}
                        missing_in_batch = set(chunk) - healed_ids
                        
                        if missing_in_batch:
                             logger.warning(f"⚠️ {len(missing_in_batch)} items missing in heal batch (likely deleted remotely). Pruning...")
                             # These are confirmed zombies
                             await self._delete_zombies(session, integration, resource_type, list(missing_in_batch))
                        
                        # INGEST
                        from app.services.shopify.sync_service import (
                            shopify_sync_service,
                        )
                        for item in items:
                            await shopify_sync_service.ingest_raw_object(
                                session, 
                                integration, 
                                resource_type.rstrip('s'),  # "orders" -> "order"
                                item
                            )
                        
                        # TRIGGER REFINEMENT (Immediate)
                        from app.services.shopify.refinement_service import (
                            shopify_refinement_service,
                        )
                        await shopify_refinement_service.process_pending_records(session, integration.id)
                        
                        logger.info(f"✅ Healed {len(items)} items via Ingest Pipeline.")
                    else:
                        logger.error(f"Failed to heal batch: {resp.status_code} {resp.text}")
                except Exception as e:
                    logger.error(f"Error during heal batch: {e}")
                    raise e # Re-raise to stop reconciliation if ingestion fails

    async def _delete_zombies(self, session: AsyncSession, integration: Integration, resource_type: str, ids: List[int]):
        # Soft delete or hard delete local records
        if resource_type == "orders":
            stmt = select(ShopifyOrder).where(
                ShopifyOrder.integration_id == integration.id,
                ShopifyOrder.shopify_order_id.in_(ids)
            )
            results = await session.execute(stmt)
            for order in results.scalars().all():
                await session.delete(order)
        elif resource_type == "products":
             stmt = select(ShopifyProduct).where(
                ShopifyProduct.integration_id == integration.id,
                ShopifyProduct.shopify_product_id.in_(ids)
            )
             results = await session.execute(stmt)
             for prod in results.scalars().all():
                 await session.delete(prod)
        elif resource_type == "customers":
             stmt = select(ShopifyCustomer).where(
                ShopifyCustomer.integration_id == integration.id,
                ShopifyCustomer.shopify_customer_id.in_(ids)
            )
             results = await session.execute(stmt)
             for cust in results.scalars().all():
                 await session.delete(cust)
        
        await session.commit()
        # CRITICAL: Re-fetch instead of refresh to be safer in async context
        # await session.refresh(integration) # This can fail with MissingGreenlet if not careful
        integration = await session.get(Integration, integration.id)
        logger.info(f"🗑️ Deleted {len(ids)} zombies.")

shopify_reconciliation_service = ShopifyReconciliationService()
