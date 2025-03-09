from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .object_id import PyObjectId
from bson import ObjectId

class AppConfigCreate(BaseModel):
    company_id: str
    access_token: str
    version: Optional[str] = None
    appId: Optional[str] = None
    businessId: Optional[str] = None
    accessToken: Optional[str] = None

class AppConfigResponse(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    company_id: str
    access_token: str
    version: Optional[str] = None
    appId: Optional[str] = None
    businessId: Optional[str] = None
    accessToken: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str} 