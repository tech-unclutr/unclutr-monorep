import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import JSON, Column, Field, SQLModel


class AuditTrail(SQLModel, table=True):
    __tablename__ = "audittrail"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(index=True)
    brand_id: Optional[uuid.UUID] = Field(None, index=True)
    workspace_id: Optional[uuid.UUID] = Field(None, index=True)
    
    actor_id: str = Field(index=True) # User ID who performed the action
    action: str = Field(index=True) # e.g., "workspace.created", "member.invited"
    
    resource_type: str # e.g., "workspace", "company_membership"
    resource_id: str # ID of the resource affected
    
    event_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
