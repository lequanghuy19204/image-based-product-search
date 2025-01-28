from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "User"
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    company_code: Optional[str] = None
    status: str = "active"
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    company_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime 
    
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UpdateProfileRequest(BaseModel):
    username: str
    email: EmailStr

class UserStatusUpdate(BaseModel):
    status: str

    @validator('status')
    def validate_status(cls, v):
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be either "active" or "inactive"')
        return v
