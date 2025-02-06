from pydantic import BaseModel, EmailStr, validator, Field, constr
from typing import Optional
from datetime import datetime
from bson import ObjectId
from .object_id import PyObjectId

class UserCreate(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr
    password: constr(min_length=6)
    role: constr(regex='^(Admin|User)$') = 'User'
    company_id: str = None

    @validator('role')
    def validate_role(cls, v):
        if v not in ["Admin", "User"]:
            raise ValueError('Role must be either "Admin" or "User"')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "password": "secret123",
                "role": "User",
                "company_id": "507f1f77bcf86cd799439011"
            }
        }

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False

class UserLoginResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str
    company_id: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str
    company_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UpdateProfileRequest(BaseModel):
    username: str
    email: EmailStr

class UserStatusUpdate(BaseModel):
    status: constr(regex='^(active|inactive)$')

class UserRoleUpdate(BaseModel):
    role: constr(regex='^(Admin|User)$')

class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str
    status: str
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    company_code: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "username": "johndoe",
                "email": "john@example.com",
                "role": "User",
                "status": "active",
                "company_id": "507f1f77bcf86cd799439012",
                "company_name": "Example Corp",
                "company_code": "EX123",
                "created_at": "2023-01-01T00:00:00.000Z",
                "updated_at": "2023-01-01T00:00:00.000Z"
            }
        }
