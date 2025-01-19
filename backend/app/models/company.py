from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CompanyCreate(BaseModel):
    company_name: str
    company_code: str

class CompanyResponse(BaseModel):
    id: str
    company_name: str 
    company_code: str
    created_at: datetime
    updated_at: datetime 