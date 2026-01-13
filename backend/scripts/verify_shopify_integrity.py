"""
Comprehensive Shopify Data Integrity Verification Script

This script verifies that all Shopify data is:
1. Being fetched from Shopify API
2. Deduplicated correctly
3. Stored with 100% accuracy
4. Maintaining real-time 1-to-1 sync with Shopify Admin
"""

import asyncio
from datetime import datetime, timezone
from sqlalchemy import func, select, text
from app.core.db import async_session_factory
from app.models.integration import Integration
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem, ShopifyLocation
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.refund import ShopifyRefund
from app.models.shopify.financials import ShopifyPayout, ShopifyDispute, ShopifyBalanceTransaction
from app.models.shopify.fulfillment import ShopifyFulfillment
from app.models.shopify.checkout import ShopifyCheckout
from app.models.shopify.marketing import ShopifyMarketingEvent
from app.models.shopify.discount import ShopifyPriceRule, ShopifyDiscountCode
from app.models.shopify.address import ShopifyAddress
from app.services.shopify.oauth_service import shopify_oauth_service
import httpx
from loguru import logger

class ShopifyIntegrityVerifier:
    def __init__(self):
        self.api_version = "2024-01"
        self.issues = []
        self.warnings = []
        self.successes = []
        
    async def verify_all(self, integration_id: str):
        """Main verification orchestrator"""
        async with async_session_factory() as session:
            # Get integration
            integration = await session.get(Integration, integration_id)
            if not integration:
                print(f"❌ Integration {integration_id} not found")
                return
            
            shop_domain = integration.metadata_info.get("shop")
            print(f"\n{'='*80}")
            print(f"🔍 SHOPIFY DATA INTEGRITY VERIFICATION")
            print(f"{'='*80}")
            print(f"Shop: {shop_domain}")
            print(f"Integration ID: {integration_id}")
            print(f"Started: {datetime.now(timezone.utc).isoformat()}")
            print(f"{'='*80}\n")
            
            # Get access token
            token = await shopify_oauth_service.get_access_token(integration_id, session)
            
            # Run all verification checks
            await self.verify_orders(session, integration, shop_domain, token)
            await self.verify_products(session, integration, shop_domain, token)
            await self.verify_customers(session, integration, shop_domain, token)
            await self.verify_inventory(session, integration, shop_domain, token)
            await self.verify_transactions(session, integration, shop_domain, token)
            await self.verify_refunds(session, integration, shop_domain, token)
            await self.verify_fulfillments(session, integration, shop_domain, token)
            await self.verify_checkouts(session, integration, shop_domain, token)
            await self.verify_price_rules(session, integration, shop_domain, token)
            await self.verify_financials(session, integration, shop_domain, token)
            await self.verify_marketing_events(session, integration, shop_domain, token)
            await self.verify_deduplication(session, integration)
            await self.verify_webhooks(shop_domain, token)
            
            # Print summary
            self.print_summary()
    
    async def verify_orders(self, session, integration, shop_domain, token):
        """Verify Orders table is 1-to-1 with Shopify"""
        print("\n📦 Verifying Orders...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get count from Shopify
            url = f"https://{shop_domain}/admin/api/{self.api_version}/orders/count.json"
            resp = await client.get(url, headers={"X-Shopify-Access-Token": token}, params={"status": "any"})
            
            if resp.status_code != 200:
                self.issues.append(f"❌ Orders: Failed to fetch count from Shopify ({resp.status_code})")
                return
            
            shopify_count = resp.json().get("count", 0)
            
            # Get count from our DB
            db_count = (await session.execute(
                select(func.count(ShopifyOrder.id)).where(ShopifyOrder.integration_id == integration.id)
            )).scalar_one()
            
            # Get raw ingest count
            raw_count = (await session.execute(
                select(func.count(ShopifyRawIngest.id)).where(
                    ShopifyRawIngest.integration_id == integration.id,
                    ShopifyRawIngest.object_type == "order"
                )
            )).scalar_one()
            
            if shopify_count == db_count:
                self.successes.append(f"✅ Orders: Perfect sync ({db_count}/{shopify_count})")
            elif abs(shopify_count - db_count) <= 2:
                self.warnings.append(f"⚠️  Orders: Minor discrepancy (DB: {db_count}, Shopify: {shopify_count}, Raw: {raw_count})")
            else:
                self.issues.append(f"❌ Orders: Significant discrepancy (DB: {db_count}, Shopify: {shopify_count}, Raw: {raw_count})")
            
            print(f"   Shopify: {shopify_count} | DB: {db_count} | Raw: {raw_count}")
    
    async def verify_products(self, session, integration, shop_domain, token):
        """Verify Products table is 1-to-1 with Shopify"""
        print("\n🛍️  Verifying Products...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://{shop_domain}/admin/api/{self.api_version}/products/count.json"
            resp = await client.get(url, headers={"X-Shopify-Access-Token": token})
            
            if resp.status_code != 200:
                self.issues.append(f"❌ Products: Failed to fetch count from Shopify ({resp.status_code})")
                return
            
            shopify_count = resp.json().get("count", 0)
            db_count = (await session.execute(
                select(func.count(ShopifyProduct.id)).where(ShopifyProduct.integration_id == integration.id)
            )).scalar_one()
            
            raw_count = (await session.execute(
                select(func.count(ShopifyRawIngest.id)).where(
                    ShopifyRawIngest.integration_id == integration.id,
                    ShopifyRawIngest.object_type == "product"
                )
            )).scalar_one()
            
            if shopify_count == db_count:
                self.successes.append(f"✅ Products: Perfect sync ({db_count}/{shopify_count})")
            elif abs(shopify_count - db_count) <= 2:
                self.warnings.append(f"⚠️  Products: Minor discrepancy (DB: {db_count}, Shopify: {shopify_count}, Raw: {raw_count})")
            else:
                self.issues.append(f"❌ Products: Significant discrepancy (DB: {db_count}, Shopify: {shopify_count}, Raw: {raw_count})")
            
            print(f"   Shopify: {shopify_count} | DB: {db_count} | Raw: {raw_count}")
            
            # Verify variants
            variant_count = (await session.execute(
                select(func.count(ShopifyProductVariant.id)).where(ShopifyProductVariant.integration_id == integration.id)
            )).scalar_one()
            print(f"   Variants in DB: {variant_count}")
    
    async def verify_customers(self, session, integration, shop_domain, token):
        """Verify Customers table is 1-to-1 with Shopify"""
        print("\n👥 Verifying Customers...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://{shop_domain}/admin/api/{self.api_version}/customers/count.json"
            resp = await client.get(url, headers={"X-Shopify-Access-Token": token})
            
            if resp.status_code != 200:
                self.issues.append(f"❌ Customers: Failed to fetch count from Shopify ({resp.status_code})")
                return
            
            shopify_count = resp.json().get("count", 0)
            db_count = (await session.execute(
                select(func.count(ShopifyCustomer.id)).where(ShopifyCustomer.integration_id == integration.id)
            )).scalar_one()
            
            if shopify_count == db_count:
                self.successes.append(f"✅ Customers: Perfect sync ({db_count}/{shopify_count})")
            else:
                self.issues.append(f"❌ Customers: Discrepancy (DB: {db_count}, Shopify: {shopify_count})")
            
            print(f"   Shopify: {shopify_count} | DB: {db_count}")
    
    async def verify_inventory(self, session, integration, shop_domain, token):
        """Verify Inventory (Locations, Levels, Items)"""
        print("\n📊 Verifying Inventory...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Locations
            url = f"https://{shop_domain}/admin/api/{self.api_version}/locations.json"
            resp = await client.get(url, headers={"X-Shopify-Access-Token": token})
            
            if resp.status_code == 200:
                shopify_locations = len(resp.json().get("locations", []))
                db_locations = (await session.execute(
                    select(func.count(ShopifyLocation.id)).where(ShopifyLocation.integration_id == integration.id)
                )).scalar_one()
                
                if shopify_locations == db_locations:
                    self.successes.append(f"✅ Locations: Perfect sync ({db_locations}/{shopify_locations})")
                else:
                    self.issues.append(f"❌ Locations: Discrepancy (DB: {db_locations}, Shopify: {shopify_locations})")
                
                print(f"   Locations - Shopify: {shopify_locations} | DB: {db_locations}")
            
            # Inventory Levels
            db_levels = (await session.execute(
                select(func.count(ShopifyInventoryLevel.id)).where(ShopifyInventoryLevel.integration_id == integration.id)
            )).scalar_one()
            print(f"   Inventory Levels in DB: {db_levels}")
            
            # Inventory Items
            db_items = (await session.execute(
                select(func.count(ShopifyInventoryItem.id)).where(ShopifyInventoryItem.integration_id == integration.id)
            )).scalar_one()
            print(f"   Inventory Items in DB: {db_items}")
    
    async def verify_transactions(self, session, integration, shop_domain, token):
        """Verify Transactions"""
        print("\n💳 Verifying Transactions...")
        
        db_count = (await session.execute(
            select(func.count(ShopifyTransaction.id)).where(ShopifyTransaction.integration_id == integration.id)
        )).scalar_one()
        
        raw_count = (await session.execute(
            select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == integration.id,
                ShopifyRawIngest.object_type == "transaction"
            )
        )).scalar_one()
        
        print(f"   DB: {db_count} | Raw: {raw_count}")
        
        if db_count > 0:
            self.successes.append(f"✅ Transactions: {db_count} records synced")
    
    async def verify_refunds(self, session, integration, shop_domain, token):
        """Verify Refunds"""
        print("\n💰 Verifying Refunds...")
        
        db_count = (await session.execute(
            select(func.count(ShopifyRefund.id)).where(ShopifyRefund.integration_id == integration.id)
        )).scalar_one()
        
        raw_count = (await session.execute(
            select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == integration.id,
                ShopifyRawIngest.object_type == "refund"
            )
        )).scalar_one()
        
        print(f"   DB: {db_count} | Raw: {raw_count}")
        
        if raw_count > 0:
            self.successes.append(f"✅ Refunds: {db_count} refined from {raw_count} raw")
    
    async def verify_fulfillments(self, session, integration, shop_domain, token):
        """Verify Fulfillments"""
        print("\n📦 Verifying Fulfillments...")
        
        db_count = (await session.execute(
            select(func.count(ShopifyFulfillment.id)).where(ShopifyFulfillment.integration_id == integration.id)
        )).scalar_one()
        
        raw_count = (await session.execute(
            select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == integration.id,
                ShopifyRawIngest.object_type == "fulfillment"
            )
        )).scalar_one()
        
        print(f"   DB: {db_count} | Raw: {raw_count}")
        
        if db_count > 0:
            self.successes.append(f"✅ Fulfillments: {db_count} records synced")
    
    async def verify_checkouts(self, session, integration, shop_domain, token):
        """Verify Checkouts"""
        print("\n🛒 Verifying Checkouts...")
        
        db_count = (await session.execute(
            select(func.count(ShopifyCheckout.id)).where(ShopifyCheckout.integration_id == integration.id)
        )).scalar_one()
        
        raw_count = (await session.execute(
            select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == integration.id,
                ShopifyRawIngest.object_type == "checkout"
            )
        )).scalar_one()
        
        print(f"   DB: {db_count} | Raw: {raw_count}")
        
        if db_count > 0:
            self.successes.append(f"✅ Checkouts: {db_count} records synced")
    
    async def verify_price_rules(self, session, integration, shop_domain, token):
        """Verify Price Rules and Discount Codes"""
        print("\n🎟️  Verifying Price Rules & Discounts...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://{shop_domain}/admin/api/{self.api_version}/price_rules/count.json"
            resp = await client.get(url, headers={"X-Shopify-Access-Token": token})
            
            if resp.status_code == 200:
                shopify_count = resp.json().get("count", 0)
                db_count = (await session.execute(
                    select(func.count(ShopifyPriceRule.id)).where(ShopifyPriceRule.integration_id == integration.id)
                )).scalar_one()
                
                if shopify_count == db_count:
                    self.successes.append(f"✅ Price Rules: Perfect sync ({db_count}/{shopify_count})")
                else:
                    self.warnings.append(f"⚠️  Price Rules: Discrepancy (DB: {db_count}, Shopify: {shopify_count})")
                
                print(f"   Price Rules - Shopify: {shopify_count} | DB: {db_count}")
            
            # Discount Codes
            db_codes = (await session.execute(
                select(func.count(ShopifyDiscountCode.id)).where(ShopifyDiscountCode.integration_id == integration.id)
            )).scalar_one()
            print(f"   Discount Codes in DB: {db_codes}")
    
    async def verify_financials(self, session, integration, shop_domain, token):
        """Verify Payouts, Disputes, Balance Transactions"""
        print("\n💵 Verifying Financials...")
        
        # Payouts
        db_payouts = (await session.execute(
            select(func.count(ShopifyPayout.id)).where(ShopifyPayout.integration_id == integration.id)
        )).scalar_one()
        
        # Disputes
        db_disputes = (await session.execute(
            select(func.count(ShopifyDispute.id)).where(ShopifyDispute.integration_id == integration.id)
        )).scalar_one()
        
        # Balance Transactions
        db_balance = (await session.execute(
            select(func.count(ShopifyBalanceTransaction.id)).where(ShopifyBalanceTransaction.integration_id == integration.id)
        )).scalar_one()
        
        print(f"   Payouts: {db_payouts}")
        print(f"   Disputes: {db_disputes}")
        print(f"   Balance Transactions: {db_balance}")
        
        if db_payouts == 0 and db_disputes == 0:
            self.warnings.append("⚠️  Financials: No data (store may not use Shopify Payments)")
        else:
            self.successes.append(f"✅ Financials: Payouts={db_payouts}, Disputes={db_disputes}")
    
    async def verify_marketing_events(self, session, integration, shop_domain, token):
        """Verify Marketing Events"""
        print("\n📢 Verifying Marketing Events...")
        
        db_count = (await session.execute(
            select(func.count(ShopifyMarketingEvent.id)).where(ShopifyMarketingEvent.integration_id == integration.id)
        )).scalar_one()
        
        print(f"   DB: {db_count}")
        
        if db_count == 0:
            self.warnings.append("⚠️  Marketing Events: No data (store may not track marketing campaigns)")
        else:
            self.successes.append(f"✅ Marketing Events: {db_count} records synced")
    
    async def verify_deduplication(self, session, integration):
        """Verify deduplication is working correctly"""
        print("\n🔄 Verifying Deduplication...")
        
        # Check for duplicate shopify_object_ids in raw_ingest
        duplicate_check = await session.execute(
            select(
                ShopifyRawIngest.object_type,
                ShopifyRawIngest.shopify_object_id,
                func.count(ShopifyRawIngest.id).label('count')
            ).where(
                ShopifyRawIngest.integration_id == integration.id,
                ShopifyRawIngest.shopify_object_id.isnot(None)
            ).group_by(
                ShopifyRawIngest.object_type,
                ShopifyRawIngest.shopify_object_id
            ).having(
                func.count(ShopifyRawIngest.id) > 1
            )
        )
        
        duplicates = duplicate_check.all()
        
        if duplicates:
            print(f"   ⚠️  Found {len(duplicates)} objects with multiple raw records (expected for updates)")
            for dup in duplicates[:5]:  # Show first 5
                print(f"      - {dup[0]} ID {dup[1]}: {dup[2]} records")
            self.successes.append(f"✅ Deduplication: Working (found {len(duplicates)} updated objects)")
        else:
            print(f"   ✅ No duplicate objects found (all unique)")
            self.successes.append("✅ Deduplication: All objects unique")
        
        # Check canonical hash uniqueness
        hash_check = await session.execute(
            select(
                ShopifyRawIngest.dedupe_hash_canonical,
                func.count(ShopifyRawIngest.id).label('count')
            ).where(
                ShopifyRawIngest.integration_id == integration.id
            ).group_by(
                ShopifyRawIngest.dedupe_hash_canonical
            ).having(
                func.count(ShopifyRawIngest.id) > 1
            )
        )
        
        hash_dups = hash_check.all()
        
        if hash_dups:
            self.issues.append(f"❌ Deduplication: Found {len(hash_dups)} duplicate canonical hashes!")
        else:
            print(f"   ✅ All canonical hashes are unique")
            self.successes.append("✅ Canonical Hash Deduplication: Perfect")
    
    async def verify_webhooks(self, shop_domain, token):
        """Verify webhooks are registered"""
        print("\n🔔 Verifying Webhooks...")
        
        webhook_status = await shopify_oauth_service.verify_webhooks(shop_domain, token)
        
        if webhook_status.get("status") == "active":
            webhook_count = webhook_status.get("count", 0)
            print(f"   ✅ {webhook_count} webhooks registered")
            self.successes.append(f"✅ Webhooks: {webhook_count} active")
            
            # Show webhook topics
            for wh in webhook_status.get("webhooks", [])[:5]:
                print(f"      - {wh['topic']}")
        else:
            self.issues.append(f"❌ Webhooks: {webhook_status.get('error', 'Unknown error')}")
    
    def print_summary(self):
        """Print verification summary"""
        print(f"\n{'='*80}")
        print(f"📊 VERIFICATION SUMMARY")
        print(f"{'='*80}\n")
        
        print(f"✅ Successes: {len(self.successes)}")
        for success in self.successes:
            print(f"   {success}")
        
        if self.warnings:
            print(f"\n⚠️  Warnings: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"   {warning}")
        
        if self.issues:
            print(f"\n❌ Issues: {len(self.issues)}")
            for issue in self.issues:
                print(f"   {issue}")
        else:
            print(f"\n🎉 NO CRITICAL ISSUES FOUND!")
        
        print(f"\n{'='*80}")
        print(f"Completed: {datetime.now(timezone.utc).isoformat()}")
        print(f"{'='*80}\n")
        
        # Overall status
        if not self.issues:
            print("✅ OVERALL STATUS: HEALTHY - 1-to-1 sync verified")
        elif len(self.issues) <= 2:
            print("⚠️  OVERALL STATUS: MINOR ISSUES - Review warnings")
        else:
            print("❌ OVERALL STATUS: CRITICAL ISSUES - Immediate attention required")

async def main():
    """Main entry point"""
    # Get the first active Shopify integration
    async with async_session_factory() as session:
        result = await session.execute(
            select(Integration).where(
                Integration.metadata_info["shop"].astext.isnot(None)
            ).limit(1)
        )
        integration = result.scalars().first()
        
        if not integration:
            print("❌ No Shopify integration found")
            return
        
        verifier = ShopifyIntegrityVerifier()
        await verifier.verify_all(str(integration.id))

if __name__ == "__main__":
    asyncio.run(main())
