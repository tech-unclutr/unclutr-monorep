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

class DataSourceRequest(SQLModel, table=True):
    __tablename__ = "datasource_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True) # Link to requesting user (Firebase UID)
    email: Optional[str] = None
    user_name: Optional[str] = None
    
    name: str = Field(index=True) # The requested datasource name
    category: Optional[str] = Field(default=None) # Optional category context
    
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
