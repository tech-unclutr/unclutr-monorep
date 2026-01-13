import asyncio
import logging
import sys
from typing import Dict, Type, List, Set, Any
from sqlmodel import select, col
from app.core.db import async_session_factory
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem, ShopifyLocation
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.refund import ShopifyRefund
from app.models.shopify.address import ShopifyAddress
from app.services.shopify.refinement_service import shopify_refinement_service

# Setup Logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("heal_shopify_sync")

# Map object types to their corresponding SQL models
MODEL_MAP: Dict[str, Type] = {
    "product": ShopifyProduct,
    "order": ShopifyOrder,
    "customer": ShopifyCustomer,
    "inventory_level": ShopifyInventoryLevel,
    "inventory_item": ShopifyInventoryItem,
    "location": ShopifyLocation,
    "transaction": ShopifyTransaction
}

# Map object types to the ID field in the destination table
ID_FIELD_MAP = {
    "product": "shopify_product_id",
    "order": "shopify_order_id",
    "customer": "shopify_customer_id",
    "inventory_item": "shopify_inventory_item_id",
    "location": "shopify_location_id",
    "transaction": "shopify_transaction_id",
    "inventory_level": "custom_composite" 
}

async def verify_children(session, obj_type: str, raw_record: ShopifyRawIngest, parent_exists: bool) -> bool:
    """
    Returns False if children are missing/inconsistent, True if healthy.
    """
    if not parent_exists:
        return False
        
    payload = raw_record.payload
    integration_id = raw_record.integration_id
    
    try:
        if obj_type == "product":
            # 1. Variants
            variants = payload.get("variants", [])
            if variants:
                var_ids = [v["id"] for v in variants if "id" in v]
                if var_ids:
                    stmt = select(ShopifyProductVariant.shopify_variant_id).where(
                        ShopifyProductVariant.integration_id == integration_id,
                        col(ShopifyProductVariant.shopify_variant_id).in_(var_ids)
                    )
                    found_ids = set((await session.execute(stmt)).scalars().all())
                    if len(found_ids) != len(set(var_ids)):
                        logger.warning(f"  - ⚠️  Product {payload.get('id')} missing variants! Expected {len(set(var_ids))}, Found {len(found_ids)}")
                        return False

            # 2. Images
            images = payload.get("images", [])
            if images:
                img_ids = [i["id"] for i in images if "id" in i]
                if img_ids:
                    stmt = select(ShopifyProductImage.shopify_image_id).where(
                        ShopifyProductImage.integration_id == integration_id,
                        col(ShopifyProductImage.shopify_image_id).in_(img_ids)
                    )
                    found_ids = set((await session.execute(stmt)).scalars().all())
                    if len(found_ids) != len(set(img_ids)):
                        logger.warning(f"  - ⚠️  Product {payload.get('id')} missing images! Expected {len(set(img_ids))}, Found {len(found_ids)}")
                        return False

        elif obj_type == "order":
            # 1. Line Items
            items = payload.get("line_items", [])
            if items:
                item_ids = [i["id"] for i in items if "id" in i]
                if item_ids:
                    stmt = select(ShopifyLineItem.shopify_line_item_id).where(
                        ShopifyLineItem.integration_id == integration_id,
                        col(ShopifyLineItem.shopify_line_item_id).in_(item_ids)
                    )
                    found_ids = set((await session.execute(stmt)).scalars().all())
                    if len(found_ids) != len(set(item_ids)):
                        logger.warning(f"  - ⚠️  Order {payload.get('id')} missing line items! Expected {len(set(item_ids))}, Found {len(found_ids)}")
                        return False

            # 2. Refunds
            refunds = payload.get("refunds", [])
            if refunds:
                ref_ids = [r["id"] for r in refunds if "id" in r]
                if ref_ids:
                    stmt = select(ShopifyRefund.shopify_refund_id).where(
                        ShopifyRefund.integration_id == integration_id,
                        col(ShopifyRefund.shopify_refund_id).in_(ref_ids)
                    )
                    found_ids = set((await session.execute(stmt)).scalars().all())
                    # Note: Refunds might be partially synced if historical sync didn't include them? 
                    # But if they are in payload, they should be in DB after refinement.
                    if len(found_ids) != len(set(ref_ids)):
                        logger.warning(f"  - ⚠️  Order {payload.get('id')} missing refunds! Expected {len(set(ref_ids))}, Found {len(found_ids)}")
                        return False

        elif obj_type == "customer":
            # 1. Addresses
            addresses = payload.get("addresses", [])
            if addresses:
                addr_ids = [a["id"] for a in addresses if "id" in a]
                if addr_ids:
                    stmt = select(ShopifyAddress.shopify_address_id).where(
                        ShopifyAddress.integration_id == integration_id,
                        col(ShopifyAddress.shopify_address_id).in_(addr_ids)
                    )
                    found_ids = set((await session.execute(stmt)).scalars().all())
                    if len(found_ids) != len(set(addr_ids)):
                        logger.warning(f"  - ⚠️  Customer {payload.get('id')} missing addresses! Expected {len(set(addr_ids))}, Found {len(found_ids)}")
                        return False

    except Exception as e:
        logger.error(f"Error checking children for {obj_type} {payload.get('id')}: {e}")
        return False

    return True

async def heal_sync():
    logger.info("🏥 Starting Universal Shopify Sync Healing (Deep Check)...")
    
    async with async_session_factory() as session:
        
        total_reset = 0
        
        for obj_type, model_cls in MODEL_MAP.items():
            logger.info(f"Checking '{obj_type}'...")
            
            stmt = select(ShopifyRawIngest).where(
                ShopifyRawIngest.object_type == obj_type,
                ShopifyRawIngest.processing_status == "processed"
            )
            raw_records = (await session.execute(stmt)).scalars().all()
            
            if not raw_records:
                logger.info(f"  - No processed raw records found for {obj_type}.")
                continue
                
            logger.info(f"  - Found {len(raw_records)} processed raw records. Verifying deep integrity...")
            
            to_reset = []
            id_field_name = ID_FIELD_MAP.get(obj_type)
            
            if id_field_name and id_field_name != "custom_composite":
                dest_stmt = select(getattr(model_cls, id_field_name))
                existing_ids = set((await session.execute(dest_stmt)).scalars().all())
                
                for r in raw_records:
                    sid = r.shopify_object_id
                    
                    # 1. Check Parent Existence
                    parent_exists = False
                    if sid in existing_ids:
                        parent_exists = True
                    else:
                        payload_id = r.payload.get("id")
                        if payload_id and int(payload_id) in existing_ids:
                             parent_exists = True
                    
                    # 2. Check Children (Deep Check)
                    is_healthy = await verify_children(session, obj_type, r, parent_exists)
                    
                    if not is_healthy:
                        to_reset.append(r)
                             
            elif obj_type == "inventory_level":
                for r in raw_records:
                    iid = r.payload.get("inventory_item_id")
                    lid = r.payload.get("location_id")
                    if not iid or not lid: continue
                    
                    check_stmt = select(ShopifyInventoryLevel).where(
                        ShopifyInventoryLevel.shopify_inventory_item_id == iid,
                        ShopifyInventoryLevel.shopify_location_id == lid
                    )
                    exists = (await session.execute(check_stmt)).first()
                    if not exists:
                        to_reset.append(r)

            if to_reset:
                logger.warning(f"  - ⚠️  Found {len(to_reset)} records with missing parents or children in {model_cls.__tablename__}!")
                
                for r in to_reset:
                    r.processing_status = "pending"
                    session.add(r)
                
                total_reset += len(to_reset)
            else:
                logger.info(f"  - ✅ All {len(raw_records)} records passed deep verification.")
                
        await session.commit()
        
        if total_reset > 0:
            logger.info(f"🚑 Reset {total_reset} records to 'pending'. Triggering Refinement...")
            
            # Loop until all are processed
            while True:
                num = await shopify_refinement_service.process_pending_records(session, limit=100)
                await session.commit()
                if num == 0:
                    break
                logger.info(f"  - Refined batch of {num}...")
                
            logger.info("✨ Healing Complete. All data restored.")
        else:
            logger.info("✨ System Healthy. No missing data (parents or children) found.")

if __name__ == "__main__":
    asyncio.run(heal_sync())
