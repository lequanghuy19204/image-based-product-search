from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductCreate(BaseModel):
    product_name: str
    product_code: str
    brand: Optional[str] = None
    description: Optional[str] = None
    price: float
    company_id: str
    image_urls: List[str]
    features: Optional[List[List[float]]] = None  # Vector đặc trưng cho mỗi ảnh
    image_hashes: Optional[List[str]] = None      # Hash cho mỗi ảnh

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_urls: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: str
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