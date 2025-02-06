from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .object_id import PyObjectId
from bson import ObjectId

class ProductCreate(BaseModel):
    product_name: str
    product_code: str
    brand: Optional[str] = None
    description: Optional[str] = None
    price: float
    company_id: str
    image_urls: List[str]
    features: Optional[List[List[float]]] = None
    image_hashes: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_urls: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    product_name: str
    product_code: str
    brand: Optional[str]
    description: Optional[str]
    price: float
    company_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    image_urls: List[str]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str} 