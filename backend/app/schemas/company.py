from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

# Shared properties
class CompanyBase(BaseModel):
    brand_name: Optional[str] = None
    legal_name: Optional[str] = None
    founded_year: Optional[str] = None
    tagline: Optional[str] = None
    industry: Optional[str] = None
    hq_city: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    support_hours: Optional[str] = None
    currency: Optional[str] = "INR"
    timezone: Optional[str] = "UTC"

# Properties to accept via API on creation
class CompanyCreate(CompanyBase):
    brand_name: str

# Properties to accept via API on update
class CompanyUpdate(BaseModel):
    brand_name: Optional[str] = None
    legal_name: Optional[str] = None
    founded_year: Optional[str] = None
    tagline: Optional[str] = None
    industry: Optional[str] = None
    hq_city: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    support_hours: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    
    # JSON fields
    tags: Optional[List[str]] = None
    presence_links: Optional[List[Dict[str, Any]]] = None

# Properties to return via API
class CompanyRead(CompanyBase):
    id: uuid.UUID
    created_at: datetime
    tags: Optional[List[str]] = None
    presence_links: Optional[List[Dict[str, Any]]] = None
    stack_summary: Optional[Dict[str, Any]] = None
    channels_summary: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
