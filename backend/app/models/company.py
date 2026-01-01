from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint, Column, JSON
from datetime import datetime
import uuid
from enum import Enum

from app.models.base_mixins import UserTrackedModel

class Company(UserTrackedModel, SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    currency: str = Field(default="INR")
    timezone: str = Field(default="UTC")
    industry: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    stack_summary: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    channels_summary: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    brands: List["Brand"] = Relationship(back_populates="company")
    memberships: List["CompanyMembership"] = Relationship(back_populates="company")

class Brand(UserTrackedModel, SQLModel, table=True):
    __table_args__ = (UniqueConstraint("company_id", "name"),)
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    company: Company = Relationship(back_populates="brands")
    workspaces: List["Workspace"] = Relationship(back_populates="brand")

class Workspace(UserTrackedModel, SQLModel, table=True):
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
from app.models.iam import CompanyMembership, WorkspaceMembership
