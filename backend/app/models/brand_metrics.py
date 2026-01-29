from datetime import date, datetime
from typing import Optional, Dict
import uuid
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects import postgresql

class BrandMetrics(SQLModel, table=True):
    """
    Aggregated daily metrics for a brand.
    Serves as the 'Source of Truth' for high-level dashboards (Bird's Eye).
    Refreshed daily or on-demand via 'Zero-Trust' logic.
    """
    __tablename__ = "brand_metric"
    __table_args__ = (UniqueConstraint("brand_id", "metric_date"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    brand_id: uuid.UUID = Field(foreign_key="brand.id", index=True, nullable=False)
    metric_date: date = Field(index=True, nullable=False)

    # Aggregated Stats
    total_revenue: float = Field(default=0.0) # Sum of all integrations LIFETIME revenue
    currency: str = Field(default="USD")
    active_sources_count: int = Field(default=0)
    total_inventory_value: float = Field(default=0.0)
    
    # Intelligence Deck (Phase 2)
    insights: Dict = Field(default={}, sa_column=Column(postgresql.JSONB))
    updated_at: datetime = Field(default_factory=datetime.utcnow)
