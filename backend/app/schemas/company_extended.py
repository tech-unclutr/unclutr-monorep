from typing import List
from uuid import UUID
from app.models.company import CompanyBase, Brand

class CompanyReadWithBrands(CompanyBase):
    id: UUID
    brands: List[Brand] = []

    class Config:
        from_attributes = True
