from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
import uuid

class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    picture_url: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class User(UserBase, table=True):
    id: Optional[str] = Field(default=None, primary_key=True) # Firebase UID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Transient field for API response
    onboarding_completed: bool = Field(default=False, sa_column=None)

class UserCreate(UserBase):
    id: str # UID is required from Firebase

class UserRead(UserBase):
    id: str
    created_at: datetime
    last_login_at: datetime
    onboarding_completed: bool = False
