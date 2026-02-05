from datetime import datetime
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import Column, Field, Relationship, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyReport(UserTrackedModel, SQLModel, table=True):
    """
    Metadata for a Shopify Report.
    Represents a saved report structure in Shopify Admin.
    """
    __tablename__ = "shopify_report"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_report_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Identity
    shopify_report_id: int = Field(sa_column=Column(BigInteger, index=True))
    name: str = Field(index=True)
    shopify_ql: Optional[str] = Field(default=None) # The query string if available
    category: Optional[str] = Field(default=None)
    
    # Timestamps
    shopify_updated_at: datetime = Field(index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

    # Relationships
    data_snapshots: list["ShopifyReportData"] = Relationship(
        back_populates="report", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    analytics_snapshots: list["ShopifyAnalyticsSnapshot"] = Relationship(
        back_populates="report",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class ShopifyReportData(UserTrackedModel, SQLModel, table=True):
    """
    Actual data snapshots executed from a report or ShopifyQL query.
    This stores the RESULT of the report at a point in time.
    """
    __tablename__ = "shopify_report_data"
    __table_args__ = (UniqueConstraint("integration_id", "query_name", "captured_at"),)
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    report_id: Optional[UUID] = Field(
        default=None, 
        sa_column=Column(ForeignKey("shopify_report.id", ondelete="CASCADE"), index=True, nullable=True)
    )
    query_name: str = Field(index=True) # E.g. "sales_over_time" or report name
    
    # The Data
    captured_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    data: Dict = Field(default={}, sa_column=Column(postgresql.JSON)) # The rows/columns result

    # Relationships
    report: Optional[ShopifyReport] = Relationship(back_populates="data_snapshots")
    analytics_snapshots: list["ShopifyAnalyticsSnapshot"] = Relationship(
        back_populates="report_data",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class ShopifyAnalyticsSnapshot(UserTrackedModel, SQLModel, table=True):
    """
    Time-series snapshots for analytics data.
    Stores normalized time-bucket data (e.g., daily/hourly metrics) extracted from report results.
    This enables efficient querying of time-series data without parsing large JSON payloads.
    """
    __tablename__ = "shopify_analytics_snapshot"
    __table_args__ = (
        UniqueConstraint("integration_id", "report_data_id", "timestamp", "granularity"),
    )
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Relationships
    report_data_id: Optional[UUID] = Field(
        default=None, 
        sa_column=Column(ForeignKey("shopify_report_data.id", ondelete="CASCADE"), index=True, nullable=True)
    )
    report_id: Optional[UUID] = Field(
        default=None, 
        sa_column=Column(ForeignKey("shopify_report.id", ondelete="CASCADE"), index=True, nullable=True)
    )
    
    # Time-series attributes
    timestamp: datetime = Field(index=True)  # The specific time bucket (e.g., 2024-01-15 00:00:00 for daily)
    granularity: str = Field(index=True)  # 'day', 'hour', 'week', 'month'
    
    # Metrics for this time bucket
    data: Dict = Field(default={}, sa_column=Column(postgresql.JSON))  # e.g., {"revenue": 1500.50, "orders": 42}
    
    # Metadata for additional context (e.g., "currency", "timezone")
    meta_data: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

    # Relationships
    report: Optional[ShopifyReport] = Relationship(back_populates="analytics_snapshots")
    report_data: Optional[ShopifyReportData] = Relationship(back_populates="analytics_snapshots")
