import asyncio
from sqlalchemy import func
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.raw_ingest import ShopifyRawIngest

async def verify_tables():
    async with async_session_factory() as session:
        # Check Product tables
        product_count = (await session.execute(select(func.count(ShopifyProduct.id)))).scalar()
        variant_count = (await session.execute(select(func.count(ShopifyProductVariant.id)))).scalar()
        image_count = (await session.execute(select(func.count(ShopifyProductImage.id)))).scalar()
        
        # Check Raw Ingest for products
        raw_product_count = (await session.execute(select(func.count(ShopifyRawIngest.id)).where(ShopifyRawIngest.object_type == "product"))).scalar()
        
        # Check status distribution
        status_stmt = select(ShopifyRawIngest.processing_status, func.count(ShopifyRawIngest.id)).where(ShopifyRawIngest.object_type == "product").group_by(ShopifyRawIngest.processing_status)
        status_counts = (await session.execute(status_stmt)).all()
        
        print(f"ShopifyProduct count: {product_count}")
        print(f"ShopifyProductVariant count: {variant_count}")
        print(f"ShopifyProductImage count: {image_count}")
        print(f"ShopifyRawIngest (product) count: {raw_product_count}")
        if raw_product_count > 0:
            sample = (await session.execute(select(ShopifyRawIngest).where(ShopifyRawIngest.object_type == "product").limit(1))).scalar()
            print(f"Sample Payload Keys: {sample.payload.keys()}")
            print(f"Sample Payload ID: {sample.payload.get('id')}")
            print(f"Sample Integration ID: {sample.integration_id}")


if __name__ == "__main__":
    asyncio.run(verify_tables())
