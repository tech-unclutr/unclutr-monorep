import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlmodel import JSON, Column, Field, SQLModel


class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    linkedin_profile: Optional[str] = None
    picture_url: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class User(UserBase, table=True):
    __tablename__ = "user"
    id: Optional[str] = Field(default=None, primary_key=True) # Firebase UID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Transient field for API response
    onboarding_completed: bool = Field(default=False)
    current_company_id: Optional[uuid.UUID] = Field(default=None)
    
    # Contact Details
    contact_number: Optional[str] = Field(default=None)
    otp_verified: bool = Field(default=False)
    designation: Optional[str] = Field(default=None)
    team: Optional[str] = Field(default=None)
    role: Optional[str] = Field(default=None)

    # Phase 5: User Preferences (Bird's Eye Goal, etc.)
    settings: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    class Config:
        extra = "ignore"

class UserCreate(UserBase):
    id: str # UID is required from Firebase

class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    linkedin_profile: Optional[str] = None
    picture_url: Optional[str] = None
    contact_number: Optional[str] = None
    otp_verified: Optional[bool] = None
    designation: Optional[str] = None
    team: Optional[str] = None
    role: Optional[str] = None # Added for explicit role management
    settings: Optional[Dict[str, Any]] = None # Added for flexibility


class UserRead(UserBase):
    id: str
    created_at: datetime
    last_login_at: datetime
    onboarding_completed: bool = False
    current_company_id: Optional[uuid.UUID] = None # Added for frontend context
    role: Optional[str] = None # Added for frontend context
    contact_number: Optional[str] = None
    designation: Optional[str] = None
    team: Optional[str] = None
    linkedin_profile: Optional[str] = None
    otp_verified: bool = False
    settings: Dict[str, Any] = {} # Added for persistence of flags
