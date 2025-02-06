from pydantic import BaseModel, Field
from datetime import datetime
from .object_id import PyObjectId
from bson import ObjectId

class CompanyCreate(BaseModel):
    company_name: str
    company_code: str

class CompanyResponse(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    company_name: str 
    company_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str} 