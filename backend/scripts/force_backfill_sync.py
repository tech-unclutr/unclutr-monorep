import sys
import os
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from collections import defaultdict
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.order import ShopifyOrder

def main():
    print("Starting Synchronous Metrics Backfill...")
    
    # Use sync engine (remove +asyncpg)
    sync_db_url = settings.DATABASE_URL.replace("+asyncpg", "")
    print(f"DB URL: {sync_db_url}")
    
    engine = create_engine(sync_db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 1. Get Active Integrations
        integrations = session.query(Integration).filter(
            Integration.status == IntegrationStatus.ACTIVE
        ).all()
        
        if not integrations:
            print("No active integrations found.")
            return

        for integration in integrations:
            print(f"Processing Integration: {integration.id}")
            
            # Clear error message
            integration.error_message = None
            integration.last_sync_at = datetime.now(timezone.utc)
            session.add(integration)
            
            # 2. Fetch all orders (last 30 days)
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
            
            orders = session.query(ShopifyOrder).filter(
                ShopifyOrder.integration_id == integration.id,
                ShopifyOrder.shopify_created_at >= start_date
            ).all()
            
            print(f"Fetched {len(orders)} orders.")
            
            # 3. Group by Date
            metrics_by_date = defaultdict(lambda: {
                "total_sales": Decimal(0),
                "net_sales": Decimal(0),
                "gross_sales": Decimal(0),
                "order_count": 0,
                "total_discounts": Decimal(0),
                "total_tax": Decimal(0),
                "total_shipping": Decimal(0),
            })
            
            for order in orders:
                if not order.shopify_created_at:
                    continue
                
                day = order.shopify_created_at.date()
                m = metrics_by_date[day]
                
                # Calculations
                gross = (order.subtotal_price or 0) + (order.total_discounts or 0)
                m["gross_sales"] += gross
                m["total_discounts"] += (order.total_discounts or 0)
                m["total_tax"] += (order.total_tax or 0)
                m["total_shipping"] += (order.total_shipping or 0)
                m["total_sales"] += gross - (order.total_discounts or 0) + (order.total_tax or 0) + (order.total_shipping or 0)
                m["net_sales"] += gross - (order.total_discounts or 0) # ignoring refunds for simplicity in backfill
                m["order_count"] += 1
            
            # 4. Upsert Metrics
            print(f"Generating metrics for {len(metrics_by_date)} days...")
            
            # 4a. Backfill empty days too (0 values) for continuity
            today = date.today()
            for i in range(30):
                target_date = today - timedelta(days=i)
                m = metrics_by_date.get(target_date, {
                     "total_sales": Decimal(0),
                     "net_sales": Decimal(0),
                     "gross_sales": Decimal(0),
                     "order_count": 0,
                     "total_discounts": Decimal(0),
                     "total_tax": Decimal(0),
                     "total_shipping": Decimal(0),
                })
                
                # Check exist
                # Using raw SQL for simplicity/robustness or ORM
                # ORM: IntegrationDailyMetric
                # Import here to avoid mixin issues?
                from app.models.integration_analytics import IntegrationDailyMetric
                
                existing = session.query(IntegrationDailyMetric).filter(
                    IntegrationDailyMetric.integration_id == integration.id,
                    IntegrationDailyMetric.snapshot_date == target_date,
                    IntegrationDailyMetric.metric_type == "ecom"
                ).first()
                
                if not existing:
                    existing = IntegrationDailyMetric(
                        integration_id=integration.id,
                        company_id=integration.company_id,
                        snapshot_date=target_date,
                        metric_type="ecom"
                    )
                
                existing.total_sales = m["total_sales"]
                existing.net_sales = m["net_sales"]
                existing.gross_sales = m["gross_sales"]
                existing.count_primary = m["order_count"]
                existing.total_discounts = m["total_discounts"]
                existing.total_tax = m["total_tax"]
                existing.total_shipping = m["total_shipping"]
                existing.average_value = m["total_sales"] / m["order_count"] if m["order_count"] > 0 else 0
                existing.currency = "USD" # Default
                
                session.add(existing)
            
            session.commit()
            print("Backfill Complete.")
            
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()
