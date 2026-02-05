import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint


class SystemRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"

class Permission(SQLModel, table=True):
    __tablename__ = "permission"
    id: str = Field(primary_key=True) # e.g., "workspace:invite"
    description: str

class Module(SQLModel, table=True):
    __tablename__ = "module"
    id: str = Field(primary_key=True) # e.g., "truth_engine"
    name: str
    description: str

class CompanyMembership(SQLModel, table=True):
    __tablename__ = "company_membership"
    __table_args__ = (UniqueConstraint("company_id", "user_id"),)
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    role: SystemRole = Field(default=SystemRole.ADMIN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    company: "Company" = Relationship(back_populates="memberships")

class WorkspaceMembership(SQLModel, table=True):
    __tablename__ = "workspace_membership"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspace.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    role: SystemRole = Field(default=SystemRole.ANALYST)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    workspace: "Workspace" = Relationship(back_populates="memberships")

class CompanyEntitlement(SQLModel, table=True):
    """Gating features/modules at company level"""
    __tablename__ = "company_entitlement"
    __table_args__ = (UniqueConstraint("company_id", "module_id"),)
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True)
    module_id: str = Field(foreign_key="module.id", index=True)
    is_enabled: bool = Field(default=True)
    expires_at: Optional[datetime] = None

# Forward references
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.company import Company, Workspace
