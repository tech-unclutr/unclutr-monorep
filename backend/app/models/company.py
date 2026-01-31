from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint, Column, JSON, Text
from datetime import datetime
import uuid
from enum import Enum

from app.models.base_mixins import UserTrackedModel

class CompanyBase(SQLModel):
    brand_name: str = Field(index=True)
    
    # Brand Identity
    legal_name: Optional[str] = Field(default=None)
    founded_year: Optional[str] = Field(default=None)
    tagline: Optional[str] = Field(default=None)
    tags: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))
    presence_links: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSON)) # {label, url, type, id}
    
    # Region & Settings
    currency: str = Field(default="INR")
    timezone: str = Field(default="UTC")
    industry: Optional[str] = Field(default=None) # Primary Category
    country: Optional[str] = Field(default=None)
    hq_city: Optional[str] = Field(default=None)
    
    # AI Context
    brand_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Support Contact
    support_email: Optional[str] = Field(default=None)
    support_phone: Optional[str] = Field(default=None)
    support_hours: Optional[str] = Field(default=None)

    # Legacy / Calculated
    stack_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    channels_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))

class Company(CompanyBase, UserTrackedModel, table=True):
    __tablename__ = "company"
    model_config = {"arbitrary_types_allowed": True}
    
    # Basic ID
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    brands: List["Brand"] = Relationship(back_populates="company")
    memberships: List["CompanyMembership"] = Relationship(back_populates="company")

class Brand(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "brand"
    __table_args__ = (UniqueConstraint("company_id", "name"),)
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    company: Company = Relationship(back_populates="brands")
    workspaces: List["Workspace"] = Relationship(back_populates="brand")

class Workspace(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "workspace"
    __table_args__ = (UniqueConstraint("brand_id", "name"),)
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True) # Direct link for faster lookups/isolation
    brand_id: uuid.UUID = Field(foreign_key="brand.id", index=True)
    name: str = Field(index=True)
    timezone: str = Field(default="UTC")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    brand: Brand = Relationship(back_populates="workspaces")
    memberships: List["WorkspaceMembership"] = Relationship(back_populates="workspace")

# Forward references for type hinting (imported here to avoid circularity if split)
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.iam import CompanyMembership, WorkspaceMembership
