from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, JSON, Column
from datetime import datetime
import uuid
from enum import Enum
from .datasource import DataSource
from .company import Workspace

if TYPE_CHECKING:
    from .company import Company

class IntegrationStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    SYNCING = "syncing"

class Integration(SQLModel, table=True):
    __tablename__ = "integrations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True, default=None) # Added for multi-tenancy
    workspace_id: uuid.UUID = Field(foreign_key="workspace.id", index=True)
    datasource_id: uuid.UUID = Field(foreign_key="datasources.id", index=True)
    
    status: IntegrationStatus = Field(default=IntegrationStatus.INACTIVE)
    
    # Storage for credentials and config
    # Note: In production, 'credentials' should be encrypted at rest or stored in a secrets manager
    credentials: Dict = Field(default={}, sa_column=Column(JSON)) 
    config: Dict = Field(default={}, sa_column=Column(JSON))
    metadata_info: Dict = Field(default={}, sa_column=Column(JSON)) # 'metadata' is reserved in SQLAlchemy
    
    error_message: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships (Standard SQLModel)
    company: "Company" = Relationship()
    workspace: Workspace = Relationship() 
    datasource: DataSource = Relationship()
