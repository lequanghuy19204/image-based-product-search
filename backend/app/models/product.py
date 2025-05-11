from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .object_id import PyObjectId
from bson import ObjectId
from pydantic import validator

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
    colors: Optional[str] = None
    creator_name: Optional[str] = None

    @validator('company_id')
    def validate_object_id(cls, v):
        if isinstance(v, str):
            try:
                return str(ObjectId(v))
            except:
                raise ValueError('Invalid ObjectId format')
        elif isinstance(v, ObjectId):
            return str(v)
        raise ValueError('Invalid ObjectId format')

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_urls: Optional[List[str]] = None
    deleted_images: Optional[List[str]] = None
    colors: Optional[str] = None
    creator_name: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

class ProductResponse(BaseModel):
    id: str = Field(alias="_id")
    product_name: str
    product_code: str
    brand: Optional[str]
    description: Optional[str]
    price: float
    company_id: str
    created_by: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime
    image_urls: List[str]
    colors: Optional[str] = None
    creator_name: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        
    @validator("id", pre=True)
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    @validator('company_id', 'created_by', pre=True)
    def convert_ids_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    def __init__(self, **data):
        super().__init__(**data)
        self.id = str(self.id)  # Ensure id is always a string

    def __repr__(self):
        return f"<ProductResponse id={self.id} product_name={self.product_name}>" 