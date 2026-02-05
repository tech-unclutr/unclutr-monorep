from datetime import date
from decimal import Decimal
from typing import Dict
from uuid import UUID, uuid4

from sqlalchemy import JSON, ForeignKey, UniqueConstraint
from sqlmodel import Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class IntegrationDailyMetric(UserTrackedModel, SQLModel, table=True):
    """
    Standardized snapshot of key performance indicators (KPIs) for any integration.
    Supports e-commerce, marketing, and financial data sources.
    """
    __tablename__ = "integration_daily_metric"
    __table_args__ = (UniqueConstraint("integration_id", "snapshot_date", "metric_type"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Date for the snapshot
    snapshot_date: date = Field(index=True, nullable=False)
    
    # Type of metric (e.g., 'ecom', 'marketing', 'finance')
    metric_type: str = Field(default="ecom", index=True)

    # Standardized KPIs
    # For Ecom: total_sales, net_sales, etc.
    # For Marketing: spend, impressions, etc. (re-purposed via meta_data or future fields)
    
    # Financial Row
    total_sales: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    net_sales: Decimal = Field(default=0, max_digits=20, decimal_places=2) 
    gross_sales: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    
    # Volume Row
    count_primary: int = Field(default=0) # E.g. Order count
    count_secondary: int = Field(default=0) # E.g. New customer count
    
    # Components
    total_discounts: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_refunds: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_tax: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_shipping: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    
    # Derived
    average_value: Decimal = Field(default=0, max_digits=20, decimal_places=2) # E.g. AOV
    
    # Snapshot Metadata
    currency: str = Field(default="USD")
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
