import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class DataSourceCategory(str, Enum):
    Storefront = "Storefront"
    Marketplace = "Marketplace"
    QuickCommerce = "QuickCommerce"
    Network = "Network"  # ONDC
    SocialCommerce = "SocialCommerce"
    # Keeping others for future extensibility if needed, but user focused on above.
    Marketing = "Marketing"
    Logistics = "Logistics"
    Payment = "Payment"
    Accounting = "Accounting"
    Analytics = "Analytics"
    Communication = "Communication"
    Retention = "Retention"

class DataSource(SQLModel, table=True):
    __tablename__ = "data_source"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    slug: str = Field(index=True, unique=True) # e.g., 'shopify', 'google_ads'
    category: DataSourceCategory = Field(index=True)
    
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    
    auth_method: Optional[str] = Field(default=None) # 'oauth2', 'api_key', 'basic', 'none'
    
    # Flags
    is_active: bool = Field(default=True)
    is_coming_soon: bool = Field(default=False)
    is_common: bool = Field(default=False) # High hit-rate in India
    is_implemented: bool = Field(default=False) # Whether we have logic for it
    
    
    # Visual / UI properties
    theme_color: Optional[str] = Field(default="#000000")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
