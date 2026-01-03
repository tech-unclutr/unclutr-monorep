from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
import uuid
from enum import Enum

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


from sqlalchemy import JSON, Column

class RequestType(str, Enum):
    DATASOURCE = "DATASOURCE"
    WORKSPACE_DELETION = "WORKSPACE_DELETION"

class UserRequest(SQLModel, table=True):
    __tablename__ = "all_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True) # Link to requesting user (Firebase UID)
    email: Optional[str] = None
    user_name: Optional[str] = None
    
    request_type: RequestType = Field(default=RequestType.DATASOURCE, index=True)
    name: str = Field(index=True) # Generic subject/identifier (e.g. datasource name)
    category: Optional[str] = Field(default=None) # Optional category context
    
    payload: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
