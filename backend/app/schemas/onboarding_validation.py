from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal, Union, Dict

# Shared Models
class RegionData(BaseModel):
    country: str
    currency: str
    timezone: str
    # Optional fields if we want to support both or future expansion
    id: Optional[str] = None
    name: Optional[str] = None
    flag: Optional[str] = None

# Page Specific Data Models
class BasicsData(BaseModel):
    companyName: str = Field(..., min_length=1, max_length=100, description="Name of the legal entity")
    brandName: str = Field(..., min_length=1, max_length=100, description="Name of the brand")
    category: str = Field(..., min_length=1, max_length=50, description="D2C category")
    region: RegionData

    class Config:
        extra = "forbid"

class ChannelsData(BaseModel):
    selectedChannels: List[str] = Field(default_factory=list, description="List of selected sales channel IDs")
    channels: Optional[Dict] = None
    primaryPartners: Optional[Dict] = None
    
    @validator('selectedChannels')
    def validate_channels(cls, v):
        # Could add check against allowed channel IDs here
        return v

class StackData(BaseModel):
    selectedTools: List[str] = Field(default_factory=list, description="List of selected tool IDs")
    stack: Optional[Dict] = None

class FinishData(BaseModel):
    # Finish page might send additional data like referral source in future
    pass

class SaveProgressRequest(BaseModel):
    page: Literal['basics', 'channels', 'stack', 'finish']
    data: Union[Dict, BasicsData, ChannelsData, StackData, FinishData]

    @validator('data')
    def validate_data_matches_page(cls, v, values):
        # We can implement stricter validation here if needed
        # but Pydantic's Union usually handles this by trying to match
        return v
