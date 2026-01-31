from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, JSON, Column
from sqlalchemy.dialects.postgresql import JSONB, JSON as PG_JSON
from datetime import datetime, timezone
from pydantic import validator
import uuid
from enum import Enum
from .datasource import DataSource
from .company import Workspace

if TYPE_CHECKING:
    from .company import Company

class IntegrationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ERROR = "ERROR"
    SYNCING = "SYNCING"
    DISCONNECT_REQUESTED = "DISCONNECT_REQUESTED"

from sqlalchemy import DateTime, String

class Integration(SQLModel, table=True):
    __tablename__ = "integration"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True, default=None) # Added for multi-tenancy
    workspace_id: uuid.UUID = Field(foreign_key="workspace.id", index=True)
    datasource_id: uuid.UUID = Field(foreign_key="data_source.id", index=True)
    
    status: IntegrationStatus = Field(default=IntegrationStatus.INACTIVE, sa_column=Column(String))
    
    # Storage for credentials and config
    # Note: In production, 'credentials' should be encrypted at rest or stored in a secrets manager
    credentials: Dict = Field(default={}, sa_column=Column(JSON)) 
    config: Dict = Field(default={}, sa_column=Column(JSON))
    metadata_info: Dict = Field(default={}, sa_column=Column(JSONB)) # Use JSONB for PG optimization
    
    # Track which version of the app was installed
    app_version: Optional[str] = Field(default=None)
    
    error_message: Optional[str] = None
    last_sync_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True)))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True)))

    # Relationships (Standard SQLModel)
    company: "Company" = Relationship()
    workspace: Workspace = Relationship() 
    datasource: DataSource = Relationship()

    @validator("last_sync_at", "created_at", "updated_at", pre=False)
    def ensure_utc(cls, v):
        if v and isinstance(v, datetime) and not v.tzinfo:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        json_encoders = {
            datetime: lambda v: v.replace(tzinfo=timezone.utc).isoformat() if not v.tzinfo else v.isoformat()
        }
