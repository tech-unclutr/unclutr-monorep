import json
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from loguru import logger
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, col
from prometheus_client import Counter, Histogram

from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.refund import ShopifyRefund
from app.models.shopify.address import ShopifyAddress
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.inventory import ShopifyLocation, ShopifyInventoryItem, ShopifyInventoryLevel
from app.models.shopify.analytics import ShopifyReport, ShopifyReportData
from app.models.shopify.financials import ShopifyPayout, ShopifyDispute
from app.models.shopify.fulfillment import ShopifyFulfillment
from app.models.shopify.checkout import ShopifyCheckout
from app.models.shopify.marketing import ShopifyMarketingEvent
from app.models.shopify.discount import ShopifyPriceRule, ShopifyDiscountCode
from app.services.shopify.metrics_service import shopify_metrics_service
from app.models.integration import Integration

ANALYTICS_SNAPSHOTS_CREATED = Counter(
    "shopify_analytics_snapshots_created_total",
    "Total number of analytics snapshots created",
    ["integration_id", "granularity", "report_name"]
)
ANALYTICS_BATCH_PROCESS_DURATION = Histogram(
    "shopify_analytics_batch_process_seconds",
    "Time spent processing a batch of analytics rows",
    ["report_name"]
)

class ShopifyRefinementService:
    """
    ETL Processor: Raw JSON (ShopifyRawIngest) -> Structured SQL (ShopifyOrder, etc.)
    """

    def _parse_iso(self, dt_str: Optional[str]) -> Optional[datetime]:
        if not dt_str: return None
        # Handle Z suffix for Python < 3.11
        if dt_str.endswith('Z'):
             dt_str = dt_str.replace('Z', '+00:00')
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    def _safe_float(self, value: Any) -> Optional[float]:
        """
        Safely parse value to float. Handles strings like "0.00", currency symbols, 
        and potential None/empty values.
        """
        if value is None:
            return 0.0
        if isinstance(value, (int, float)):
            return float(value)
        if not isinstance(value, str):
            try: return float(value)
            except: return 0.0
            
        # Clean string: remove symbols and commas
        cleaned = value.strip().replace("$", "").replace("€", "").replace("£", "").replace(",", "")
        if not cleaned:
            return 0.0
            
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            logger.warning(f"Could not parse value '{value}' to float, defaulting to 0.0")
            return 0.0

    def _safe_decimal_parse(self, value: Any) -> Any:
        """
        Safely parse value to Decimal string, handling edge cases.
        Returns original value if not parseable as Decimal.
        """
        if not isinstance(value, str):
            return value
        
        # Remove common currency symbols, whitespace, and thousands separators
        cleaned = value.strip().replace("$", "").replace("€", "").replace("£", "").replace(",", "")
        
        try:
            # Decimal() will validate format and handle scientific notation
            decimal_val = Decimal(cleaned)
            return str(decimal_val)
        except Exception:
            # Not a valid number, return as-is
            return value

    async def process_pending_records(self, session: AsyncSession, integration_id: Optional[UUID] = None, limit: int = 50) -> int:
        """
        Fetches 'pending' raw records and refines them.
        """
        stmt = select(ShopifyRawIngest).where(
            ShopifyRawIngest.processing_status == "pending"
        )

        if integration_id:
            stmt = stmt.where(ShopifyRawIngest.integration_id == integration_id)

        stmt = stmt.limit(limit)

        results = await session.execute(stmt)
        records = results.scalars().all()

        for record in records:
            record_id = record.id
            # Use a savepoint (nested transaction) for each record
            # This ensures that if ONE record fails, it doesn't roll back the ENTIRE session
            # and doesn't expire other objects like the 'Integration' instance.
            nested = await session.begin_nested()
            try:
                if record.object_type == "order":
                    await self._refine_order(session, record)
                elif record.object_type == "customer":
                    await self._upsert_customer(session, record, record.payload)
                elif record.object_type == "product":
                    await self._refine_product(session, record)
                elif record.object_type == "location":
                    await self._refine_location(session, record)
                elif record.object_type == "inventory_level":
                    await self._refine_inventory_level(session, record)
                elif record.object_type == "inventory_item":
                    await self._refine_inventory_item(session, record)
                elif record.object_type == "transaction":
                    await self._refine_standalone_transaction(session, record)
                elif record.object_type == "report":
                    await self._refine_report(session, record)
                elif record.object_type == "report_data":
                    await self._refine_report_data(session, record)
                elif record.object_type == "payout":
                    await self._refine_payout(session, record)
                elif record.object_type == "dispute":
                    await self._refine_dispute(session, record)
                elif record.object_type == "refund":
                    await self._refine_refund(session, record)
                elif record.object_type == "fulfillment":
                    await self._refine_fulfillment(session, record)
                elif record.object_type == "checkout":
                    await self._refine_checkout(session, record)
                elif record.object_type == "marketing_event":
                    await self._refine_marketing_event(session, record)
                elif record.object_type == "price_rule":
                    await self._refine_price_rule(session, record)
                elif record.object_type == "discount_code":
                    await self._refine_discount_code(session, record)

                record.processing_status = "processed"
                record.processed_at = datetime.utcnow()
                await nested.commit()
            
            except Exception as e:
                logger.error(f"Refinement Failed for record {record_id}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                try:
                    await nested.rollback()
                    # Re-fetch the record in fresh state to update status
                    record = await session.get(ShopifyRawIngest, record_id)
                    if record:
                        record.processing_status = "failed"
                        record.error_message = str(e)
                        # We don't commit here, we just flush. 
                        # The caller will commit the whole session.
                        await session.flush()
                except Exception as nested_e:
                    logger.error(f"Failed to record failure for {record_id}: {nested_e}")

        await session.flush()
        return len(records)

    async def _refine_order(self, session: AsyncSession, raw: ShopifyRawIngest):
        """
        Process a raw order (create or update ShopifyOrder + Line Items).
        """
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        
        # Check if exists
        stmt = select(ShopifyOrder).where(
            ShopifyOrder.integration_id == raw.integration_id,
            ShopifyOrder.shopify_order_id == shopify_id
        )
        existing_order = (await session.execute(stmt)).scalars().first()

        processed_at_dt = self._parse_iso(payload.get("processed_at"))
        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))
        
        # Extract Customer ID if present
        customer_data = payload.get("customer")
        customer_shopify_id = int(customer_data.get("id")) if customer_data else None
        
        local_customer_uuid = None
        if customer_shopify_id:
            cust_stmt = select(ShopifyCustomer.id).where(
                ShopifyCustomer.integration_id == raw.integration_id,
                ShopifyCustomer.shopify_customer_id == customer_shopify_id
            )
            local_customer_uuid = (await session.execute(cust_stmt)).scalar_one_or_none()

        if existing_order:
            # Update
            existing_order.shopify_order_number = int(payload.get("order_number")) if payload.get("order_number") else None
            existing_order.shopify_name = payload.get("name")
            existing_order.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing_order.shopify_processed_at = processed_at_dt
            existing_order.currency = payload.get("currency")
            existing_order.total_price = self._safe_float(payload.get("total_price"))
            existing_order.subtotal_price = self._safe_float(payload.get("subtotal_price"))
            existing_order.total_tax = self._safe_float(payload.get("total_tax"))
            existing_order.financial_status = payload.get("financial_status") or "pending"
            existing_order.fulfillment_status = payload.get("fulfillment_status") or "unfulfilled"
            existing_order.customer_id = local_customer_uuid
            # Actually model has customer_id: Optional[UUID] = Field(default=None, foreign_key="shopify_customer.id")
            # But the payload gives an integer Shopify ID. 
            # In order.py: customer_id: Optional[UUID] = Field(default=None, foreign_key="shopify_customer.id")
            # This is a local FK. We might need a separate field for shopify_customer_id if we want it.
            # For now, let's stick to the model.
            existing_order.raw_payload = payload
            existing_order.updated_by = raw.created_by or "System"
        else:
            # Create
            new_order = ShopifyOrder(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_order_id=shopify_id,
                shopify_order_number=int(payload.get("order_number")) if payload.get("order_number") else None,
                shopify_name=payload.get("name") or str(payload.get("order_number")),
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                shopify_processed_at=processed_at_dt,
                currency=payload.get("currency"),
                total_price=self._safe_float(payload.get("total_price")),
                subtotal_price=self._safe_float(payload.get("subtotal_price")),
                total_tax=self._safe_float(payload.get("total_tax")),
                financial_status=payload.get("financial_status") or "pending",
                fulfillment_status=payload.get("fulfillment_status") or "unfulfilled",
                customer_id=local_customer_uuid,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_order)
            await session.flush() # Need ID for line items if we were linking by DB ID (but we use shopify_order_id)

        # Process Line Items
        order_to_link = existing_order or new_order
        await session.flush() # Ensure ID is set
        logger.info(f"DEBUG: Linking line items for Order UUID: {order_to_link.id}")
        await self._process_line_items(session, raw.integration_id, raw.company_id, order_to_link.id, payload.get("line_items", []))

        # Handle Customer upsert if present
        if customer_data:
            await self._upsert_customer(session, raw, customer_data)

    async def _process_line_items(self, session: AsyncSession, integration_id: UUID, company_id: UUID, target_order_id: UUID, items: List[Dict]):
        # Ideally, we should sync existing items or delete simplified logic:
        # For this prototype: upset based on line_item_id
        for item in items:
            line_id = int(item.get("id"))
            stmt = select(ShopifyLineItem).where(
                ShopifyLineItem.integration_id == integration_id,
                ShopifyLineItem.shopify_line_item_id == line_id
            )
            existing_line = (await session.execute(stmt)).scalars().first()
            
            if existing_line:
                existing_line.quantity = item.get("quantity")
                existing_line.price = self._safe_float(item.get("price"))
                existing_line.total_discount = self._safe_float(item.get("total_discount") or 0)
                # existing_line.fulfillable_quantity = item.get("fulfillable_quantity") # Not in model
                # existing_line.fulfillment_status = item.get("fulfillment_status") # Not in model
                existing_line.variant_title = item.get("variant_title")
                existing_line.vendor = item.get("vendor")
            else:
                new_line = ShopifyLineItem(
                    integration_id=integration_id,
                    company_id=company_id,
                    order_id=target_order_id,
                    shopify_line_item_id=line_id,
                    title=item.get("title"),
                    variant_title=item.get("variant_title"),
                    vendor=item.get("vendor"),
                    quantity=item.get("quantity"),
                    price=self._safe_float(item.get("price")),
                    sku=item.get("sku"),
                    variant_id=int(item.get("variant_id")) if item.get("variant_id") else None,
                    product_id=int(item.get("product_id")) if item.get("product_id") else None,
                    total_discount=self._safe_float(item.get("total_discount") or 0),
                    created_by="System",
                    updated_by="System"
                )
                session.add(new_line)

    async def _upsert_customer(self, session: AsyncSession, raw: ShopifyRawIngest, customer_data: Dict):
        shopify_id = int(customer_data.get("id"))
        email = customer_data.get("email")

        stmt = select(ShopifyCustomer).where(
            ShopifyCustomer.integration_id == raw.integration_id,
            ShopifyCustomer.shopify_customer_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        created_at_dt = self._parse_iso(customer_data.get("created_at"))
        updated_at_dt = self._parse_iso(customer_data.get("updated_at"))

        if existing:
            existing.email = email
            existing.first_name = customer_data.get("first_name")
            existing.last_name = customer_data.get("last_name")
            existing.phone = customer_data.get("phone")
            existing.orders_count = customer_data.get("orders_count")
            existing.total_spent = self._safe_float(customer_data.get("total_spent"))
            existing.currency = customer_data.get("currency")
            existing.last_order_id = int(customer_data.get("last_order_id")) if customer_data.get("last_order_id") else None
            existing.tags = customer_data.get("tags")
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.raw_payload = customer_data
            existing.updated_by = raw.created_by or "System"
        else:
            new_customer = ShopifyCustomer(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_customer_id=shopify_id,
                email=email,
                first_name=customer_data.get("first_name"),
                last_name=customer_data.get("last_name"),
                phone=customer_data.get("phone"),
                orders_count=customer_data.get("orders_count"),
                total_spent=self._safe_float(customer_data.get("total_spent")),
                currency=customer_data.get("currency"),
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                last_order_id=int(customer_data.get("last_order_id")) if customer_data.get("last_order_id") else None,
                tags=customer_data.get("tags"),
                raw_payload=customer_data,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_customer)
        
        # Process addresses if available
        if "addresses" in customer_data:
            await self._process_addresses(session, raw, shopify_id, customer_data["addresses"], customer_data.get("default_address"))

        # Prune Zombies: Delete local addresses that are no longer in the Shopify payload for this customer
        # This ensures Zero-Drift for addresses
        remote_ids = {int(a.get("id")) for a in customer_data.get("addresses", []) if a.get("id")}
        
        # Find all current local addresses for this customer
        local_stmt = select(ShopifyAddress.shopify_address_id).where(
            ShopifyAddress.integration_id == raw.integration_id,
            ShopifyAddress.shopify_customer_id == shopify_id
        )
        local_results = await session.execute(local_stmt)
        # shopify_address_id is BigInt in DB, so it comes back as int
        local_ids = {row[0] for row in local_results.all()}
        
        zombies = local_ids - remote_ids
        if zombies:
             logger.warning(f"🗑️ Pruning {len(zombies)} zombie addresses for Customer {shopify_id}")
             delete_stmt = select(ShopifyAddress).where(
                 ShopifyAddress.integration_id == raw.integration_id,
                 ShopifyAddress.shopify_address_id.in_(list(zombies))
             )
             zombie_objs = (await session.execute(delete_stmt)).scalars().all()
             for z in zombie_objs:
                 await session.delete(z)
        
        await session.flush()

    async def _process_addresses(
        self, 
        session: AsyncSession, 
        raw: ShopifyRawIngest, 
        customer_shopify_id: int, 
        addresses: List[Dict],
        default_address: Optional[Dict]
    ):
        """Process customer addresses, linking them to the local customer UUID."""
        # Resolve local customer UUID
        cust_stmt = select(ShopifyCustomer.id).where(
            ShopifyCustomer.integration_id == raw.integration_id,
            ShopifyCustomer.shopify_customer_id == customer_shopify_id
        )
        local_customer_uuid = (await session.execute(cust_stmt)).scalar_one_or_none()
        
        if not local_customer_uuid:
            logger.warning(f"⚠️ Could not process addresses: Local customer not found for shopify_customer_id {customer_shopify_id}")
            return
        
        default_address_id = int(default_address.get("id")) if default_address and default_address.get("id") else None
        
        for addr in addresses:
            addr_id = int(addr.get("id"))
            
            stmt = select(ShopifyAddress).where(
                ShopifyAddress.integration_id == raw.integration_id,
                ShopifyAddress.shopify_address_id == addr_id
            )
            existing = (await session.execute(stmt)).scalars().first()
            
            is_default = (addr_id == default_address_id)
            
            if existing:
                existing.customer_id = local_customer_uuid
                existing.first_name = addr.get("first_name")
                existing.last_name = addr.get("last_name")
                existing.company = addr.get("company")
                existing.address1 = addr.get("address1")
                existing.address2 = addr.get("address2")
                existing.city = addr.get("city")
                existing.province = addr.get("province")
                existing.country = addr.get("country")
                existing.zip = addr.get("zip")
                existing.phone = addr.get("phone")
                existing.name = addr.get("name")
                existing.province_code = addr.get("province_code")
                existing.country_code = addr.get("country_code")
                existing.country_name = addr.get("country_name")
                existing.default = is_default
                existing.raw_payload = addr
                existing.updated_by = raw.created_by or "System"
            else:
                new_addr = ShopifyAddress(
                    integration_id=raw.integration_id,
                    company_id=raw.company_id,
                    shopify_customer_id=customer_shopify_id,
                    customer_id=local_customer_uuid,
                    shopify_address_id=addr_id,
                    first_name=addr.get("first_name"),
                    last_name=addr.get("last_name"),
                    company=addr.get("company"),
                    address1=addr.get("address1"),
                    address2=addr.get("address2"),
                    city=addr.get("city"),
                    province=addr.get("province"),
                    country=addr.get("country"),
                    zip=addr.get("zip"),
                    phone=addr.get("phone"),
                    name=addr.get("name"),
                    province_code=addr.get("province_code"),
                    country_code=addr.get("country_code"),
                    country_name=addr.get("country_name"),
                    default=is_default,
                    raw_payload=addr,
                    created_by=raw.created_by or "System",
                    updated_by=raw.created_by or "System"
                )
                session.add(new_addr)

    async def _refine_product(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))

        stmt = select(ShopifyProduct).where(
            ShopifyProduct.integration_id == raw.integration_id,
            ShopifyProduct.shopify_product_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))
        published_at_dt = self._parse_iso(payload.get("published_at"))

        if existing:
            existing.title = payload.get("title")
            existing.body_html = payload.get("body_html")
            existing.vendor = payload.get("vendor")
            existing.product_type = payload.get("product_type")
            existing.handle = payload.get("handle")
            existing.status = payload.get("status")
            existing.tags = payload.get("tags")
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.published_at = published_at_dt
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_product = ShopifyProduct(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_product_id=shopify_id,
                title=payload.get("title"),
                body_html=payload.get("body_html"),
                vendor=payload.get("vendor"),
                product_type=payload.get("product_type"),
                handle=payload.get("handle"),
                status=payload.get("status"),
                tags=payload.get("tags"),
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                published_at=published_at_dt,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_product)

        # Save Product and get its UUID
        await session.flush()
        local_product_uuid = existing.id if existing else new_product.id

        # Process Variants
        await self._process_variants(session, raw, local_product_uuid, payload.get("variants", []))
        
        # Process Images
        await self._process_images(session, raw, local_product_uuid, payload.get("images", []))
    
    async def _process_variants(self, session: AsyncSession, raw: ShopifyRawIngest, local_product_uuid: UUID, variants: List[Dict]):
        for variant in variants:
            variant_id = int(variant.get("id"))
            stmt = select(ShopifyProductVariant).where(
                ShopifyProductVariant.integration_id == raw.integration_id,
                ShopifyProductVariant.shopify_variant_id == variant_id
            )
            existing = (await session.execute(stmt)).scalars().first()
            
            created_at_dt = self._parse_iso(variant.get("created_at"))
            updated_at_dt = self._parse_iso(variant.get("updated_at"))

            if existing:
                existing.title = variant.get("title")
                existing.price = self._safe_float(variant.get("price"))
                existing.sku = variant.get("sku")
                existing.shopify_inventory_item_id = int(variant.get("inventory_item_id")) if variant.get("inventory_item_id") else None
                existing.inventory_quantity = variant.get("inventory_quantity")
                existing.shopify_created_at = created_at_dt
                existing.shopify_updated_at = updated_at_dt
                existing.raw_payload = variant
                existing.updated_by = raw.created_by or "System"
            else:
                new_variant = ShopifyProductVariant(
                    integration_id=raw.integration_id,
                    company_id=raw.company_id,
                    shopify_variant_id=variant_id,
                    product_id=local_product_uuid,
                    title=variant.get("title"),
                    price=self._safe_float(variant.get("price")),
                    sku=variant.get("sku"),
                    shopify_inventory_item_id=int(variant.get("inventory_item_id")) if variant.get("inventory_item_id") else None,
                    inventory_quantity=variant.get("inventory_quantity"),
                    shopify_created_at=created_at_dt,
                    shopify_updated_at=updated_at_dt,
                    raw_payload=variant,
                    created_by=raw.created_by or "System",
                    updated_by=raw.created_by or "System"
                )
                session.add(new_variant)

    async def _process_images(self, session: AsyncSession, raw: ShopifyRawIngest, local_product_uuid: UUID, images: List[Dict]):
        for image in images:
            image_id = int(image.get("id"))
            stmt = select(ShopifyProductImage).where(
                ShopifyProductImage.integration_id == raw.integration_id,
                ShopifyProductImage.shopify_image_id == image_id
            )
            existing = (await session.execute(stmt)).scalars().first()
            
            created_at_dt = self._parse_iso(image.get("created_at"))
            updated_at_dt = self._parse_iso(image.get("updated_at"))

            if existing:
                existing.position = image.get("position")
                existing.alt = image.get("alt")
                existing.width = image.get("width")
                existing.height = image.get("height")
                existing.src = image.get("src")
                existing.shopify_created_at = created_at_dt
                existing.shopify_updated_at = updated_at_dt
                existing.raw_payload = image
                existing.updated_by = raw.created_by or "System"
            else:
                new_image = ShopifyProductImage(
                    integration_id=raw.integration_id,
                    company_id=raw.company_id,
                    product_id=local_product_uuid,
                    shopify_image_id=image_id,
                    src=image.get("src"),
                    alt=image.get("alt"),
                    width=image.get("width"),
                    height=image.get("height"),
                    position=image.get("position") or 1,
                    shopify_created_at=created_at_dt,
                    shopify_updated_at=updated_at_dt,
                    raw_payload=image,
                    created_by=raw.created_by or "System",
                    updated_by=raw.created_by or "System"
                )
                session.add(new_image)

    async def _refine_location(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        
        stmt = select(ShopifyLocation).where(
            ShopifyLocation.integration_id == raw.integration_id,
            ShopifyLocation.shopify_location_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.name = payload.get("name")
            existing.address1 = payload.get("address1")
            existing.city = payload.get("city")
            existing.zip = payload.get("zip")
            existing.country = payload.get("country")
            existing.phone = payload.get("phone")
            existing.active = payload.get("active") if payload.get("active") is not None else True
            existing.shopify_created_at = created_at_dt
            existing.shopify_updated_at = updated_at_dt
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_location = ShopifyLocation(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_location_id=shopify_id,
                name=payload.get("name"),
                address1=payload.get("address1"),
                city=payload.get("city"),
                zip=payload.get("zip"),
                country=payload.get("country"),
                phone=payload.get("phone"),
                active=payload.get("active") if payload.get("active") is not None else True,
                shopify_created_at=created_at_dt,
                shopify_updated_at=updated_at_dt,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_location)

    async def _refine_inventory_item(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        
        stmt = select(ShopifyInventoryItem).where(
            ShopifyInventoryItem.integration_id == raw.integration_id,
            ShopifyInventoryItem.shopify_inventory_item_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.sku = payload.get("sku")
            existing.cost = self._safe_float(payload.get("cost"))
            # existing.country_code_of_origin = payload.get("country_code_of_origin") # Not in model
            existing.tracked = payload.get("tracked")
            # existing.shopify_updated_at = updated_at_dt # Not in model
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_item = ShopifyInventoryItem(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_inventory_item_id=shopify_id,
                sku=payload.get("sku"),
                cost=self._safe_float(payload.get("cost")),
                # country_code_of_origin=payload.get("country_code_of_origin"),
                tracked=payload.get("tracked"),
                # shopify_created_at=created_at_dt,
                # shopify_updated_at=updated_at_dt,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_item)

    async def _refine_inventory_level(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        inventory_item_id = int(payload.get("inventory_item_id"))
        location_id = int(payload.get("location_id"))
        
        stmt = select(ShopifyInventoryLevel).where(
            ShopifyInventoryLevel.integration_id == raw.integration_id,
            ShopifyInventoryLevel.shopify_inventory_item_id == inventory_item_id,
            ShopifyInventoryLevel.shopify_location_id == location_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.available = payload.get("available")
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_level = ShopifyInventoryLevel(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_inventory_item_id=inventory_item_id,
                shopify_location_id=location_id,
                available=payload.get("available"),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_level)

    async def _refine_standalone_transaction(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        shopify_order_id = int(payload.get("order_id"))
        
        # Resolve Local Order UUID
        order_stmt = select(ShopifyOrder.id).where(
            ShopifyOrder.integration_id == raw.integration_id,
            ShopifyOrder.shopify_order_id == shopify_order_id
        )
        local_order_uuid = (await session.execute(order_stmt)).scalar_one_or_none()
        
        if not local_order_uuid:
            logger.warning(f"⚠️ Could not refine standalone transaction {shopify_id}: Local order not found for shopify_order_id {shopify_order_id}")
            return

        stmt = select(ShopifyTransaction).where(
            ShopifyTransaction.integration_id == raw.integration_id,
            ShopifyTransaction.shopify_transaction_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        created_at_dt = self._parse_iso(payload.get("created_at"))
        processed_at_dt = self._parse_iso(payload.get("processed_at"))

        if existing:
            existing.kind = payload.get("kind")
            existing.status = payload.get("status")
            existing.amount = self._safe_float(payload.get("amount"))
            existing.currency = payload.get("currency")
            existing.gateway = payload.get("gateway")
            existing.message = payload.get("message")
            existing.shopify_processed_at = processed_at_dt or datetime.utcnow()
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_txn = ShopifyTransaction(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                order_id=local_order_uuid,
                shopify_transaction_id=shopify_id,
                shopify_order_id=shopify_order_id,
                kind=payload.get("kind"),
                status=payload.get("status"),
                amount=self._safe_float(payload.get("amount")),
                currency=payload.get("currency"),
                gateway=payload.get("gateway"),
                message=payload.get("message"),
                shopify_processed_at=processed_at_dt or datetime.utcnow(),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_txn)

    async def _refine_report(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        
        stmt = select(ShopifyReport).where(
            ShopifyReport.integration_id == raw.integration_id,
            ShopifyReport.shopify_report_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        # Reports don't have standard created/updated at in API list sometimes, but here we assume detail
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.name = payload.get("name")
            existing.shopify_ql = payload.get("shopify_ql")
            existing.category = payload.get("category")
            existing.updated_at_shopify = updated_at_dt
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_report = ShopifyReport(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_report_id=shopify_id,
                name=payload.get("name"),
                shopify_ql=payload.get("shopify_ql"),
                category=payload.get("category"),
                updated_at_shopify=updated_at_dt,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_report)

    async def _refine_payout(self, session: AsyncSession, raw: ShopifyRawIngest):
        """Refines a Shopify payout record."""
        payload = raw.payload
        shopify_id = int(payload.get("id"))

        # Check for existing payout using integration_id composite key
        stmt = select(ShopifyPayout).where(
            ShopifyPayout.integration_id == raw.integration_id,
            ShopifyPayout.shopify_payout_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        date_val = None
        if payload.get("date"):
            try:
                 date_val = datetime.strptime(payload.get("date"), "%Y-%m-%d").date()
            except ValueError:
                 logger.warning(f"Invalid date format for payout {shopify_id}: {payload.get('date')}")

        if existing:
            existing.status = payload.get("status")
            existing.date = date_val
            existing.currency = payload.get("currency")
            existing.amount = self._safe_float(payload.get("amount"))
            existing.summary = payload.get("summary")
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_payout = ShopifyPayout(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_payout_id=shopify_id,
                status=payload.get("status"),
                date=date_val,
                currency=payload.get("currency"),
                amount=self._safe_float(payload.get("amount")),
                summary=payload.get("summary"),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_payout)

    async def _refine_dispute(self, session: AsyncSession, raw: ShopifyRawIngest):
        """Refines a Shopify dispute record."""
        payload = raw.payload
        shopify_id = int(payload.get("id"))

        # Check for existing dispute
        stmt = select(ShopifyDispute).where(
            ShopifyDispute.integration_id == raw.integration_id,
            ShopifyDispute.shopify_dispute_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        initiated_at = self._parse_iso(payload.get("initiated_at"))
        evidence_due_by = self._parse_iso(payload.get("evidence_due_by"))
        finalized_on = self._parse_iso(payload.get("finalized_on"))

        # Resolve Local Order UUID if order_id present in payload
        shopify_order_id = int(payload.get("order_id")) if payload.get("order_id") else None
        local_order_uuid = None
        if shopify_order_id:
            order_stmt = select(ShopifyOrder.id).where(
                ShopifyOrder.integration_id == raw.integration_id,
                ShopifyOrder.shopify_order_id == shopify_order_id
            )
            local_order_uuid = (await session.execute(order_stmt)).scalar_one_or_none()

        if existing:
            existing.order_id = local_order_uuid
            existing.type = payload.get("type")
            existing.amount = self._safe_float(payload.get("amount"))
            existing.currency = payload.get("currency")
            existing.reason = payload.get("reason")
            existing.status = payload.get("status")
            existing.initiated_at = initiated_at
            existing.evidence_due_by = evidence_due_by
            existing.finalized_on = finalized_on
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_dispute = ShopifyDispute(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_dispute_id=shopify_id,
                shopify_order_id=shopify_order_id,
                order_id=local_order_uuid,
                type=payload.get("type"),
                amount=self._safe_float(payload.get("amount")),
                currency=payload.get("currency"),
                reason=payload.get("reason"),
                status=payload.get("status"),
                initiated_at=initiated_at,
                evidence_due_by=evidence_due_by,
                finalized_on=finalized_on,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_dispute)

    async def _refine_report_data(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload

        report_id_str = payload.get("report_id")
        report_name = payload.get("report_name", "unknown")
        query = payload.get("query", "")
        result = payload.get("result", {})
        
        report_id = None
        if report_id_str:
             try:
                 from uuid import UUID
                 report_id = UUID(report_id_str)
                 logger.info(f"Refining report data: Parsed report_id {report_id} from {report_id_str}")
             except Exception as e:
                 logger.error(f"Invalid report_id format: {report_id_str}. Error: {e}")
        else:
              logger.warning(f"Refining report data: No report_id in payload: {payload.keys()}")

        captured_at = raw.fetched_at or datetime.utcnow()

        stmt = select(ShopifyReportData).where(
            ShopifyReportData.integration_id == raw.integration_id,
            ShopifyReportData.query_name == report_name,
            ShopifyReportData.captured_at == captured_at
        )
        existing = (await session.execute(stmt)).scalars().first()

        report_data_record = None
        if existing:
            existing.data = result
            existing.updated_by = raw.created_by or "System"
            report_data_record = existing
        else:
            report_data_record = ShopifyReportData(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                report_id=report_id,
                query_name=report_name,
                captured_at=captured_at,
                data=result,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(report_data_record)
        
        # Flush to get the ID
        await session.flush()
        
        # Process analytics snapshots from the result
        await self._process_analytics_snapshots(session, report_data_record, result, raw)

    async def _process_analytics_snapshots(
        self,
        session: AsyncSession,
        report_data: ShopifyReportData,
        result: Dict[str, Any],
        raw: ShopifyRawIngest
    ):
        """
        Transforms ShopifyQL result rows into ShopifyAnalyticsSnapshot records.
        Expects result to have 'rows' and optionally 'columns' fields.
        """
        from app.models.shopify.analytics import ShopifyAnalyticsSnapshot
        
        # Maximum rows to process to prevent memory exhaustion
        MAX_ROWS_PER_REPORT = 10000
        
        # Extract rows from the result
        rows = result.get("rows", [])
        if not rows:
            logger.info(f"No rows found in report data for {report_data.query_name}")
            return
        
        # Check for row limit
        original_row_count = len(rows)
        if original_row_count > MAX_ROWS_PER_REPORT:
            logger.warning(f"Report {report_data.query_name} has {original_row_count} rows. Truncating to {MAX_ROWS_PER_REPORT} for safety.")
            rows = rows[:MAX_ROWS_PER_REPORT]
            # Store truncation info in report_data meta_data
            if not report_data.meta_data:
                report_data.meta_data = {}
            report_data.meta_data.update({
                "truncated": True,
                "original_row_count": original_row_count,
                "processed_row_count": MAX_ROWS_PER_REPORT
            })
        
        # Get shop timezone from integration metadata
        integration = await session.get(Integration, report_data.integration_id)
        shop_timezone = integration.metadata_info.get("iana_timezone", "UTC") if integration else "UTC"
        
        logger.info(f"Processing {len(rows)} rows for analytics snapshots (shop timezone: {shop_timezone})")
        
        BATCH_SIZE = 100
        total_created = 0
        total_updated = 0
        
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            with ANALYTICS_BATCH_PROCESS_DURATION.labels(report_name=report_data.query_name).time():
                for row in batch:
                    try:
                        # Extract timestamp
                        timestamp = None
                        granularity = "day"
                        
                        if "day" in row:
                            timestamp = self._parse_iso(row["day"]) or datetime.strptime(row["day"], "%Y-%m-%d")
                            granularity = "day"
                        elif "hour" in row:
                             # Format usually: 2023-01-01 15:00:00
                            timestamp = self._parse_iso(row["hour"].replace(" ", "T"))
                            granularity = "hour"
                        elif "week" in row:
                            timestamp = self._parse_iso(f"{row['week']}T00:00:00")
                            granularity = "week"
                        elif "month" in row:
                            timestamp = self._parse_iso(f"{row['month']}-01T00:00:00")
                            granularity = "month"
                        
                        if not timestamp:
                            logger.warning(f"Could not extract timestamp from row: {row}")
                            continue

                        # Extract metrics - store all numeric fields in data
                        metrics = {}
                        for key, value in row.items():
                            if key not in ["day", "hour", "week", "month"]:
                                # Use safe decimal parsing for all values
                                metrics[key] = self._safe_decimal_parse(value)
                        
                        # Check if snapshot already exists (idempotency)
                        stmt = select(ShopifyAnalyticsSnapshot).where(
                            ShopifyAnalyticsSnapshot.integration_id == report_data.integration_id,
                            ShopifyAnalyticsSnapshot.report_id == report_data.report_id,
                            ShopifyAnalyticsSnapshot.timestamp == timestamp,
                            ShopifyAnalyticsSnapshot.granularity == granularity
                        )
                        existing = (await session.execute(stmt)).scalars().first()
                        
                        if existing:
                            existing.data = metrics
                            existing.meta_data = {
                                "raw_row": row,
                                "query_name": report_data.query_name,
                                "shop_timezone": shop_timezone,
                                "captured_at_utc": datetime.utcnow().isoformat()
                            }
                            existing.updated_by = raw.created_by or "System"
                            total_updated += 1
                        else:
                            snapshot = ShopifyAnalyticsSnapshot(
                                integration_id=report_data.integration_id,
                                company_id=report_data.company_id,
                                report_data_id=report_data.id,
                                report_id=report_data.report_id,
                                timestamp=timestamp,
                                granularity=granularity,
                                data=metrics,
                                meta_data={
                                    "raw_row": row,
                                    "query_name": report_data.query_name,
                                    "shop_timezone": shop_timezone,
                                    "captured_at_utc": datetime.utcnow().isoformat()
                                },
                                created_by=raw.created_by or "System",
                                updated_by=raw.created_by or "System"
                            )
                            session.add(snapshot)
                            total_created += 1
                            
                            ANALYTICS_SNAPSHOTS_CREATED.labels(
                                integration_id=str(report_data.integration_id),
                                granularity=granularity,
                                report_name=report_data.query_name
                            ).inc()

                    except Exception as e:
                        logger.error(f"Failed to process analytics row: {e}")
                        continue
                
                # Commit after each batch to keep transaction size manageable
                await session.flush()
        
        logger.info(f"Analytics processing complete for {report_data.query_name}: {total_created} created, {total_updated} updated")
        
    async def _refine_refund(self, session: AsyncSession, raw: ShopifyRawIngest):
        """
        Refines a Shopify refund record.
        """
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        shopify_order_id = int(payload.get("order_id"))
        
        # Resolve Local Order UUID
        order_stmt = select(ShopifyOrder.id).where(
            ShopifyOrder.integration_id == raw.integration_id,
            ShopifyOrder.shopify_order_id == shopify_order_id
        )
        local_order_uuid = (await session.execute(order_stmt)).scalar_one_or_none()
        
        if not local_order_uuid:
            logger.warning(f"⚠️ Could not refine refund {shopify_id}: Local order not found for shopify_order_id {shopify_order_id}")
            return

        stmt = select(ShopifyRefund).where(
            ShopifyRefund.integration_id == raw.integration_id,
            ShopifyRefund.shopify_refund_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        processed_at_dt = self._parse_iso(payload.get("created_at"))

        if existing:
            existing.note = payload.get("note")
            existing.refund_line_items = payload.get("refund_line_items", [])
            existing.processed_at = processed_at_dt or datetime.utcnow()
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_refund = ShopifyRefund(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                order_id=local_order_uuid,
                shopify_refund_id=shopify_id,
                shopify_order_id=shopify_order_id,
                note=payload.get("note"),
                refund_line_items=payload.get("refund_line_items", []),
                processed_at=processed_at_dt or datetime.utcnow(),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_refund)

    async def _refine_fulfillment(self, session: AsyncSession, raw: ShopifyRawIngest):
        """
        Refines a Shopify fulfillment record.
        Saves record and updates the master order's fulfillment status.
        """
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        shopify_order_id = int(payload.get("order_id"))
        
        # Resolve Local Order UUID
        order_stmt = select(ShopifyOrder).where(
            ShopifyOrder.integration_id == raw.integration_id,
            ShopifyOrder.shopify_order_id == shopify_order_id
        )
        order = (await session.execute(order_stmt)).scalars().first()
        
        if not order:
            raise ValueError(f"Local order not found for shopify_order_id {shopify_order_id}")

        stmt = select(ShopifyFulfillment).where(
            ShopifyFulfillment.integration_id == raw.integration_id,
            ShopifyFulfillment.shopify_fulfillment_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.status = payload.get("status")
            existing.shipment_status = payload.get("shipment_status")
            existing.location_id = int(payload.get("location_id")) if payload.get("location_id") else None
            existing.tracking_company = payload.get("tracking_company")
            existing.tracking_number = payload.get("tracking_number")
            existing.tracking_url = payload.get("tracking_url")
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_fulfillment = ShopifyFulfillment(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                order_id=order.id,
                shopify_order_id=shopify_order_id,
                shopify_fulfillment_id=shopify_id,
                status=payload.get("status"),
                shipment_status=payload.get("shipment_status"),
                location_id=int(payload.get("location_id")) if payload.get("location_id") else None,
                tracking_company=payload.get("tracking_company"),
                tracking_number=payload.get("tracking_number"),
                tracking_url=payload.get("tracking_url"),
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_fulfillment)

        # Update order fulfillment status
        new_status = payload.get("status")
        if new_status:
            order.fulfillment_status = new_status
            order.shopify_updated_at = datetime.utcnow()
            order.updated_by = raw.created_by or "System"
            session.add(order)
            logger.info(f"Refined fulfillment {shopify_id} and updated order {shopify_order_id} status to {new_status}")

    async def _refine_checkout(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))

        stmt = select(ShopifyCheckout).where(
            ShopifyCheckout.integration_id == raw.integration_id,
            ShopifyCheckout.shopify_checkout_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))
        completed_at_dt = self._parse_iso(payload.get("completed_at"))

        if existing:
            existing.email = payload.get("email")
            existing.token = payload.get("token")
            existing.cart_token = payload.get("cart_token")
            existing.abandoned_checkout_url = payload.get("abandoned_checkout_url")
            existing.subtotal_price = Decimal(str(payload.get("subtotal_price") or 0))
            existing.total_price = Decimal(str(payload.get("total_price") or 0))
            existing.total_tax = Decimal(str(payload.get("total_tax") or 0))
            existing.currency = payload.get("currency") or "USD"
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.shopify_completed_at = completed_at_dt
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_checkout = ShopifyCheckout(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_checkout_id=shopify_id,
                token=payload.get("token"),
                cart_token=payload.get("cart_token"),
                email=payload.get("email"),
                abandoned_checkout_url=payload.get("abandoned_checkout_url"),
                subtotal_price=Decimal(str(payload.get("subtotal_price") or 0)),
                total_price=Decimal(str(payload.get("total_price") or 0)),
                total_tax=Decimal(str(payload.get("total_tax") or 0)),
                currency=payload.get("currency") or "USD",
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                shopify_completed_at=completed_at_dt,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_checkout)

    async def _refine_marketing_event(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))

        stmt = select(ShopifyMarketingEvent).where(
            ShopifyMarketingEvent.integration_id == raw.integration_id,
            ShopifyMarketingEvent.shopify_marketing_event_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        started_at_dt = self._parse_iso(payload.get("started_at"))
        ended_at_dt = self._parse_iso(payload.get("ended_at"))
        scheduled_to_end_at_dt = self._parse_iso(payload.get("scheduled_to_end_at"))

        if existing:
            existing.type = payload.get("event_type") or payload.get("type")
            existing.description = payload.get("description")
            existing.marketing_channel = payload.get("marketing_channel")
            existing.paid = payload.get("paid") or False
            existing.manage_url = payload.get("manage_url")
            existing.preview_url = payload.get("preview_url")
            existing.started_at = started_at_dt
            existing.ended_at = ended_at_dt
            existing.scheduled_to_end_at = scheduled_to_end_at_dt
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_event = ShopifyMarketingEvent(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_marketing_event_id=shopify_id,
                type=payload.get("event_type") or payload.get("type") or "unknown",
                description=payload.get("description"),
                marketing_channel=payload.get("marketing_channel"),
                paid=payload.get("paid") or False,
                manage_url=payload.get("manage_url"),
                preview_url=payload.get("preview_url"),
                started_at=started_at_dt,
                ended_at=ended_at_dt,
                scheduled_to_end_at=scheduled_to_end_at_dt,
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_event)

    async def _refine_price_rule(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))

        stmt = select(ShopifyPriceRule).where(
            ShopifyPriceRule.integration_id == raw.integration_id,
            ShopifyPriceRule.shopify_price_rule_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        starts_at_dt = self._parse_iso(payload.get("starts_at"))
        ends_at_dt = self._parse_iso(payload.get("ends_at"))
        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.title = payload.get("title")
            existing.value_type = payload.get("value_type")
            existing.value = float(payload.get("value") or 0)
            existing.target_type = payload.get("target_type")
            existing.target_selection = payload.get("target_selection")
            existing.allocation_method = payload.get("allocation_method")
            existing.usage_limit = payload.get("usage_limit")
            existing.once_per_customer = payload.get("once_per_customer") or False
            existing.starts_at = starts_at_dt or datetime.utcnow()
            existing.ends_at = ends_at_dt
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_rule = ShopifyPriceRule(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                shopify_price_rule_id=shopify_id,
                title=payload.get("title"),
                value_type=payload.get("value_type"),
                value=float(payload.get("value") or 0),
                target_type=payload.get("target_type"),
                target_selection=payload.get("target_selection"),
                allocation_method=payload.get("allocation_method"),
                usage_limit=payload.get("usage_limit"),
                once_per_customer=payload.get("once_per_customer") or False,
                starts_at=starts_at_dt or datetime.utcnow(),
                ends_at=ends_at_dt,
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_rule)

    async def _refine_discount_code(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        shopify_id = int(payload.get("id"))
        shopify_price_rule_id = int(payload.get("price_rule_id"))

        # Resolve Price Rule UUID
        rule_stmt = select(ShopifyPriceRule.id).where(
            ShopifyPriceRule.integration_id == raw.integration_id,
            ShopifyPriceRule.shopify_price_rule_id == shopify_price_rule_id
        )
        rule_uuid = (await session.execute(rule_stmt)).scalar_one_or_none()

        if not rule_uuid:
            raise ValueError(f"Local price rule not found for shopify_price_rule_id {shopify_price_rule_id}")

        stmt = select(ShopifyDiscountCode).where(
            ShopifyDiscountCode.integration_id == raw.integration_id,
            ShopifyDiscountCode.shopify_discount_code_id == shopify_id
        )
        existing = (await session.execute(stmt)).scalars().first()

        created_at_dt = self._parse_iso(payload.get("created_at"))
        updated_at_dt = self._parse_iso(payload.get("updated_at"))

        if existing:
            existing.code = payload.get("code")
            existing.usage_count = int(payload.get("usage_count") or 0)
            existing.shopify_updated_at = updated_at_dt or datetime.utcnow()
            existing.raw_payload = payload
            existing.updated_by = raw.created_by or "System"
        else:
            new_code = ShopifyDiscountCode(
                integration_id=raw.integration_id,
                company_id=raw.company_id,
                price_rule_id=rule_uuid,
                shopify_price_rule_id=shopify_price_rule_id,
                shopify_discount_code_id=shopify_id,
                code=payload.get("code"),
                usage_count=int(payload.get("usage_count") or 0),
                shopify_created_at=created_at_dt or datetime.utcnow(),
                shopify_updated_at=updated_at_dt or datetime.utcnow(),
                raw_payload=payload,
                created_by=raw.created_by or "System",
                updated_by=raw.created_by or "System"
            )
            session.add(new_code)

shopify_refinement_service = ShopifyRefinementService()

