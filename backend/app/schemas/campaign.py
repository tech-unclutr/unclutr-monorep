from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CampaignContextUpdate(BaseModel):
    brand_context: Optional[str] = None
    customer_context: Optional[str] = None
    team_member_context: Optional[str] = None
    preliminary_questions: Optional[List[str]] = None
    question_bank: Optional[List[str]] = None
    incentive_bank: Optional[List[str]] = None
    cohort_questions: Optional[Dict[str, List[str]]] = None
    cohort_incentives: Optional[Dict[str, str]] = None
    incentive: Optional[str] = None
    cohort_data: Optional[Dict[str, Any]] = None # Unified cohort config

class CampaignExecutionUpdate(BaseModel):
    total_call_target: Optional[int] = None
    call_duration: Optional[int] = None
    cohort_config: Optional[Dict[str, int]] = None
    selected_cohorts: Optional[List[str]] = None
    execution_windows: Optional[List[Dict[str, Any]]] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    
class CampaignSettingsUpdate(CampaignContextUpdate, CampaignExecutionUpdate):
    name: Optional[str] = None


class CampaignContextSuggestions(BaseModel):
    brand_context: str
    team_member_context: str


class CampaignLeadBase(BaseModel):
    customer_name: str
    contact_number: str
    cohort: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = {}

class CreateFromCsvRequest(BaseModel):
    campaign_name: Optional[str] = None
    leads: List[CampaignLeadBase]
    force_create: bool = False

class CreateFullCampaignRequest(BaseModel):
    campaign_name: str
    leads: List[CampaignLeadBase]
    settings: CampaignSettingsUpdate
    force_create: bool = False

class ReplaceLeadsRequest(BaseModel):
    leads: List[CampaignLeadBase]
