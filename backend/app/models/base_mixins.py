from typing import Optional

from sqlmodel import Field, SQLModel


class UserTrackedModel(SQLModel):
    """
    Mixin for models that track who created/updated the record.
    Stamping logic in app/core/stamping.py handles automatic population.
    """
    created_by: Optional[str] = Field(default=None, index=True)
    updated_by: Optional[str] = Field(default=None, index=True)
