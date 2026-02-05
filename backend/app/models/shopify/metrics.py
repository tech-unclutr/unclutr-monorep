from datetime import date
from decimal import Decimal
from typing import Dict
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyDailyMetric(UserTrackedModel, SQLModel, table=True):
    """
    Stores a snapshot of key performance indicators (KPIs) for a specific date.
    This enables historical charting and trend analysis without re-calculating 
    from raw orders every time.
    """
    __tablename__ = "shopify_daily_metric"
    __table_args__ = (UniqueConstraint("integration_id", "snapshot_date"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Date for the snapshot
    snapshot_date: date = Field(index=True, nullable=False)
    
    # Core KPIs
    total_sales: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    net_sales: Decimal = Field(default=0, max_digits=20, decimal_places=2) # Gross - Discounts - Refunds
    order_count: int = Field(default=0)
    customer_count_new: int = Field(default=0) # New customers on this date
    average_order_value: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    
    # Financial components for reconciliation
    gross_sales: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_discounts: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_refunds: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_tax: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_shipping: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    
    # Currency at time of snapshot
    currency: str = Field(default="USD")
    
    # Additional data (e.g. top products, category distribution)
    meta_data: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
