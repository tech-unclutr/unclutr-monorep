from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Column, JSON
from datetime import datetime, date
from enum import Enum
import uuid

class MetricType(str, Enum):
    """Types of metrics we track"""
    USER_ENGAGEMENT = "user_engagement"
    ONBOARDING = "onboarding"
    INTEGRATION = "integration"
    BUSINESS = "business"
    SYSTEM = "system"

class UserMetrics(SQLModel, table=True):
    """Track user engagement and activity metrics"""
    __tablename__ = "user_metrics"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    metric_date: date = Field(index=True)
    
    # Session metrics
    session_count: int = Field(default=0)
    total_session_duration_seconds: int = Field(default=0)
    
    # Activity metrics
    page_views: int = Field(default=0)
    interactions: int = Field(default=0)
    features_used: Dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Engagement score (0-100)
    engagement_score: float = Field(default=0.0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OnboardingMetrics(SQLModel, table=True):
    """Track onboarding funnel and completion metrics"""
    __tablename__ = "onboarding_metrics"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True, unique=True)
    
    # Funnel tracking
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    abandoned_at: Optional[datetime] = None
    
    # Step completion tracking
    basics_completed_at: Optional[datetime] = None
    channels_completed_at: Optional[datetime] = None
    stack_completed_at: Optional[datetime] = None
    finish_completed_at: Optional[datetime] = None
    
    # Time spent per step (seconds)
    basics_duration_seconds: Optional[int] = None
    channels_duration_seconds: Optional[int] = None
    stack_duration_seconds: Optional[int] = None
    finish_duration_seconds: Optional[int] = None
    
    # Total time to complete
    total_duration_seconds: Optional[int] = None
    
    # Interaction metrics
    drawer_opens: int = Field(default=0)
    search_uses: int = Field(default=0)
    datasources_selected: int = Field(default=0)
    integration_requests: int = Field(default=0)
    
    # Drop-off tracking
    last_step_visited: str = Field(default="basics")
    drop_off_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class IntegrationMetrics(SQLModel, table=True):
    """Track integration health and performance"""
    __tablename__ = "integration_metrics"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True, default=None) # Added for multi-tenancy
    integration_id: uuid.UUID = Field(foreign_key="integrations.id", index=True)
    metric_date: date = Field(index=True)
    
    # Sync metrics
    sync_attempts: int = Field(default=0)
    sync_successes: int = Field(default=0)
    sync_failures: int = Field(default=0)
    
    # Performance metrics
    avg_sync_duration_seconds: Optional[float] = None
    total_records_synced: int = Field(default=0)
    total_data_volume_bytes: int = Field(default=0)
    
    # Error tracking
    error_count: int = Field(default=0)
    last_error_message: Optional[str] = None
    last_error_at: Optional[datetime] = None
    
    # Health score (0-100)
    health_score: float = Field(default=100.0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BusinessMetrics(SQLModel, table=True):
    """Track business KPIs and growth metrics"""
    __tablename__ = "business_metrics"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    metric_date: date = Field(index=True, unique=True)
    
    # Customer metrics
    total_users: int = Field(default=0)
    active_users_daily: int = Field(default=0)
    active_users_weekly: int = Field(default=0)
    active_users_monthly: int = Field(default=0)
    
    new_users: int = Field(default=0)
    churned_users: int = Field(default=0)
    
    # Company metrics
    total_companies: int = Field(default=0)
    new_companies: int = Field(default=0)
    active_companies: int = Field(default=0)
    
    # Workspace metrics
    total_workspaces: int = Field(default=0)
    new_workspaces: int = Field(default=0)
    active_workspaces: int = Field(default=0)
    
    # Integration metrics
    total_integrations: int = Field(default=0)
    new_integrations: int = Field(default=0)
    active_integrations: int = Field(default=0)
    
    # Onboarding metrics
    onboarding_started: int = Field(default=0)
    onboarding_completed: int = Field(default=0)
    onboarding_completion_rate: float = Field(default=0.0)
    
    # Engagement metrics
    avg_session_duration_seconds: Optional[float] = None
    avg_page_views_per_user: Optional[float] = None
    
    # Revenue metrics (placeholder for future)
    mrr: Optional[float] = None
    arr: Optional[float] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemMetrics(SQLModel, table=True):
    """Track system health and performance"""
    __tablename__ = "system_metrics"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # API metrics
    api_requests_total: int = Field(default=0)
    api_requests_success: int = Field(default=0)
    api_requests_error: int = Field(default=0)
    avg_response_time_ms: Optional[float] = None
    
    # Database metrics
    db_connections_active: int = Field(default=0)
    db_query_avg_time_ms: Optional[float] = None
    
    # Error metrics
    error_count: int = Field(default=0)
    error_rate: float = Field(default=0.0)
    
    # Resource metrics
    cpu_usage_percent: Optional[float] = None
    memory_usage_percent: Optional[float] = None
    
    # Health status
    overall_health_score: float = Field(default=100.0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
