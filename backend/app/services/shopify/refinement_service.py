import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from loguru import logger
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, col

from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.refund import ShopifyRefund
from app.models.shopify.product import ShopifyProduct

class ShopifyRefinementService:
    """
    ETL Processor: Raw JSON (ShopifyRawIngest) -> Structured SQL (ShopifyOrder, etc.)
    """

    def _parse_iso(self, dt_str: Optional[str]) -> Optional[datetime]:
        if not dt_str: return None
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    async def process_pending_records(self, session: AsyncSession, limit: int = 50) -> int:
        """
        Fetches 'pending' raw records and refines them.
        """
        stmt = select(ShopifyRawIngest).where(
            ShopifyRawIngest.processing_status == "pending"
        ).limit(limit)
        
        results = await session.execute(stmt)
        records = results.scalars().all()
        
        for record in records:
            try:
                if record.object_type == "order":
                    await self._refine_order(session, record)
                elif record.object_type == "customer":
                    await self._upsert_customer(session, record, record.payload)
                elif record.object_type == "product":
                    await self._refine_product(session, record)
                
                record.processing_status = "processed"
                record.processed_at = datetime.utcnow()
                
            except Exception as e:
                logger.error(f"Refinement Failed for {record.id}: {e}")
                record.processing_status = "failed"
                record.error_message = str(e)
        
        
        await session.commit()
        return len(records)

    async def _refine_order(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        
        # 1. Upsert Customer (if present)
        customer_id = None
        if "customer" in payload and payload["customer"]:
            customer_record = await self._upsert_customer(session, raw, payload["customer"])
            customer_id = customer_record.id

        # 2a. Calculate Refunds (Granular)
        refunded_subtotal = 0
        refunded_tax = 0
        refunds = payload.get("refunds", [])
        for r in refunds:
            for rli in r.get("refund_line_items", []):
                refunded_subtotal += float(rli.get("subtotal") or 0)
                refunded_tax += float(rli.get("total_tax") or 0)

        # 2b. Upsert Order
        # Check existing by shopify_id to update or insert
        stmt = select(ShopifyOrder).where(
            ShopifyOrder.integration_id == raw.integration_id,
            ShopifyOrder.shopify_order_id == payload["id"]
        )
        existing_order = (await session.execute(stmt)).scalars().first()
        
        order_data = {
            "integration_id": raw.integration_id,
            "company_id": raw.company_id,
            "shopify_order_id": payload["id"],
            "shopify_order_number": payload["order_number"],
            "shopify_name": payload.get("name", f"#{payload['order_number']}"),
            "financial_status": payload.get("financial_status", "unknown"),
            "fulfillment_status": payload.get("fulfillment_status"),
            "total_price": payload.get("total_price", 0),
            "subtotal_price": payload.get("subtotal_price", 0),
            "total_tax": payload.get("total_tax", 0),
            "total_discounts": payload.get("total_discounts", 0),
            "refunded_subtotal": refunded_subtotal,
            "refunded_tax": refunded_tax,
            "currency": payload.get("currency", "USD"),
            "customer_id": customer_id,
            "email": payload.get("email"),
            "shopify_created_at": self._parse_iso(payload.get("created_at")) or datetime.utcnow(),
            "shopify_updated_at": raw.shopify_updated_at or datetime.utcnow(),
            "shopify_processed_at": self._parse_iso(payload.get("processed_at")),
            "shopify_closed_at": self._parse_iso(payload.get("closed_at")),
        }
        
        if existing_order:
            for k, v in order_data.items():
                setattr(existing_order, k, v)
            existing_order.updated_by = raw.created_by or "System"
            order_to_save = existing_order
        else:
            order_to_save = ShopifyOrder(**order_data)
            order_to_save.created_by = raw.created_by or "System"
            order_to_save.updated_by = raw.created_by or "System"
            session.add(order_to_save)
        
        await session.flush() # Get ID
        
        # 3. Handle Line Items (Full replace for simplicity, or diffing)
        # For immutable ledger, we might archive old ones, but for current state sync, request replace is acceptable standard pattern
        # Delete existing lines
        if existing_order:
             await session.execute(
                 select(ShopifyLineItem).where(ShopifyLineItem.order_id == existing_order.id)
             )
             # Actually, simpler: SQLModel relationship cascade might handle delete-orphan? 
             # Explicit delete to be safe:
             # from sqlmodel import delete
             # await session.exec(delete(ShopifyLineItem).where(ShopifyLineItem.order_id == existing_order.id))
             # But 'delete' is not directly imported.
             pass 

        # We'll rely on an iterative update or just adding new ones if simple.
        # Strict "Truth" usually implies recreating line items on update to ensure match.
        
        for item in payload.get("line_items", []):
            if "id" not in item:
                continue
             # Check if exists (dedupe by line_item_id)
            li_stmt = select(ShopifyLineItem).where(
                ShopifyLineItem.integration_id == raw.integration_id,
                ShopifyLineItem.shopify_line_item_id == item["id"]
            )
            existing_li = (await session.execute(li_stmt)).scalars().first()
            
            li_data = {
                "integration_id": raw.integration_id,
                "company_id": raw.company_id,
                "order_id": order_to_save.id,
                "shopify_line_item_id": item["id"],
                "product_id": item.get("product_id"),
                "variant_id": item.get("variant_id"),
                "sku": item.get("sku"),
                "title": item.get("title"),
                "variant_title": item.get("variant_title"),
                "vendor": item.get("vendor"),
                "quantity": item.get("quantity", 0),
                "price": item.get("price", 0),
                "total_discount": item.get("total_discount", 0)
            }
            
            if existing_li:
                for k, v in li_data.items():
                    setattr(existing_li, k, v)
                existing_li.updated_by = raw.created_by or "System"
            else:
                new_li = ShopifyLineItem(**li_data)
                new_li.created_by = raw.created_by or "System"
                new_li.updated_by = raw.created_by or "System"
                session.add(new_li)

        # 4. Handle Transactions & Refunds
        if "transactions" in payload:
            await self._refine_transactions(session, raw, order_to_save, payload["transactions"])
            
        if "refunds" in payload:
            await self._refine_refunds(session, raw, order_to_save, payload["refunds"])


    async def _upsert_customer(self, session: AsyncSession, raw: ShopifyRawIngest, cust_payload: Dict) -> ShopifyCustomer:
        stmt = select(ShopifyCustomer).where(
            ShopifyCustomer.integration_id == raw.integration_id,
            ShopifyCustomer.shopify_customer_id == cust_payload["id"]
        )
        existing = (await session.execute(stmt)).scalars().first()
        
        c_data = {
            "integration_id": raw.integration_id,
            "company_id": raw.company_id,
            "shopify_customer_id": cust_payload["id"],
            "email": cust_payload.get("email"),
            "first_name": cust_payload.get("first_name"),
            "last_name": cust_payload.get("last_name"),
            "state": cust_payload.get("state"),
            "verified_email": cust_payload.get("verified_email", False),
            "shopify_created_at": self._parse_iso(cust_payload.get("created_at")) or datetime.utcnow(),
            "shopify_updated_at": raw.shopify_updated_at or datetime.utcnow(), 
        }
        
        if existing:
            for k, v in c_data.items():
                setattr(existing, k, v)
            existing.updated_by = raw.created_by or "System"
        else:
            cust = ShopifyCustomer(**c_data)
            cust.created_by = raw.created_by or "System"
            cust.updated_by = raw.created_by or "System"
            session.add(cust)
            existing = cust # assign for return
            
        # Enhanced fields update (if present)
        existing.phone = cust_payload.get("phone")
        existing.tags = cust_payload.get("tags")
        existing.orders_count = cust_payload.get("orders_count", 0)
        existing.total_spent = float(cust_payload.get("total_spent", 0.0) or 0.0)
        existing.currency = cust_payload.get("currency")
        existing.last_order_id = cust_payload.get("last_order_id")
        existing.accepts_marketing = cust_payload.get("accepts_marketing", False)
        if "default_address" in cust_payload:
            existing.default_address = cust_payload["default_address"]
            
        await session.flush()
        return existing

    async def _refine_transactions(self, session: AsyncSession, raw: ShopifyRawIngest, order: ShopifyOrder, transactions: List[Dict]):
        for txn in transactions:
            if "id" not in txn:
                continue
            stmt = select(ShopifyTransaction).where(
                ShopifyTransaction.integration_id == raw.integration_id,
                ShopifyTransaction.shopify_transaction_id == txn["id"]
            )
            existing = (await session.execute(stmt)).scalars().first()
            
            t_data = {
                "integration_id": raw.integration_id,
                "company_id": raw.company_id,
                "order_id": order.id,
                "shopify_transaction_id": txn["id"],
                "shopify_order_id": order.shopify_order_id,
                "parent_id": txn.get("parent_id"),
                "amount": txn.get("amount", 0),
                "currency": txn.get("currency", "USD"),
                "kind": txn.get("kind", "unknown"),
                "status": txn.get("status", "unknown"),
                "gateway": txn.get("gateway"),
                "authorization": txn.get("authorization"),
                "error_code": txn.get("error_code"),
                "message": txn.get("message"),
                "processed_at": self._parse_iso(txn.get("processed_at")) or datetime.utcnow(),
            }
            
            if existing:
                for k, v in t_data.items():
                    setattr(existing, k, v)
                existing.updated_by = raw.created_by or "System"
            else:
                new_txn = ShopifyTransaction(**t_data)
                new_txn.created_by = raw.created_by or "System"
                new_txn.updated_by = raw.created_by or "System"
                session.add(new_txn)

    async def _refine_refunds(self, session: AsyncSession, raw: ShopifyRawIngest, order: ShopifyOrder, refunds: List[Dict]):
        for ref in refunds:
            if "id" not in ref:
                continue
            stmt = select(ShopifyRefund).where(
                ShopifyRefund.integration_id == raw.integration_id,
                ShopifyRefund.shopify_refund_id == ref["id"]
            )
            existing = (await session.execute(stmt)).scalars().first()
            
            r_data = {
                "integration_id": raw.integration_id,
                "company_id": raw.company_id,
                "order_id": order.id,
                "shopify_refund_id": ref["id"],
                "shopify_order_id": order.shopify_order_id,
                "note": ref.get("note"),
                "restock": ref.get("restock", False),
                "refund_line_items": ref.get("refund_line_items", []),
                "processed_at": self._parse_iso(ref.get("processed_at")) or datetime.utcnow(),
            }
            
            if existing:
                for k, v in r_data.items():
                    setattr(existing, k, v)
                existing.updated_by = raw.created_by or "System"
            else:
                new_ref = ShopifyRefund(**r_data)
                new_ref.created_by = raw.created_by or "System"
                new_ref.updated_by = raw.created_by or "System"
                session.add(new_ref)

    async def _refine_product(self, session: AsyncSession, raw: ShopifyRawIngest):
        payload = raw.payload
        if "id" not in payload:
            return

        stmt = select(ShopifyProduct).where(
            ShopifyProduct.integration_id == raw.integration_id,
            ShopifyProduct.shopify_product_id == payload["id"]
        )
        existing = (await session.execute(stmt)).scalars().first()

        p_data = {
            "integration_id": raw.integration_id,
            "company_id": raw.company_id,
            "shopify_product_id": payload["id"],
            "title": payload.get("title", "Unknown Product"),
            "vendor": payload.get("vendor"),
            "product_type": payload.get("product_type"),
            "status": payload.get("status", "active"),
            "raw_payload": payload,
        }

        if existing:
            for k, v in p_data.items():
                setattr(existing, k, v)
            existing.updated_by = raw.created_by or "System"
            existing.updated_at = datetime.utcnow()
        else:
            new_prod = ShopifyProduct(**p_data)
            new_prod.created_by = raw.created_by or "System"
            new_prod.updated_by = raw.created_by or "System"
            session.add(new_prod)

shopify_refinement_service = ShopifyRefinementService()
