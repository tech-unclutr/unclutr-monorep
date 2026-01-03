from typing import List, Optional
from pydantic import BaseModel

class RegionSettings(BaseModel):
    country: Optional[str] = None
    currency: str = "INR"
    timezone: str = "UTC"

class ChannelSettings(BaseModel):
    d2c: List[str] = []
    marketplaces: List[str] = []
    qcom: List[str] = []
    others: List[str] = []

class StackSettings(BaseModel):
    orders: List[str] = []
    payments: List[str] = []
    shipping: List[str] = []
    payouts: List[str] = []
    marketing: List[str] = []
    analytics: List[str] = []
    finance: List[str] = []
    others: List[str] = []

class OnboardingSettingsResponse(BaseModel):
    companyName: str
    brandName: str
    category: Optional[str] = None
    region: RegionSettings
    channels: ChannelSettings
    stack: StackSettings
