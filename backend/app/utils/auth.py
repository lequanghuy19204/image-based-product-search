from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from typing import Optional

import os
from dotenv import load_dotenv
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

load_dotenv()  # Tải biến môi trường từ file .env
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")  # Lấy SECRET_KEY từ biến môi trường
ALGORITHM = "HS256"

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, remember: bool = False):
    to_encode = data.copy()
    # Nếu remember = True, token sẽ hết hạn sau 30 ngày
    # Ngược lại token sẽ hết hạn sau 1 ngày
    expire = datetime.utcnow() + timedelta(days=30 if remember else 1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token and return decoded payload
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload is None:
            raise HTTPException(
                status_code=401,
                detail="Could not validate credentials"
            )
        return payload
    except JWTError as e:
        print("Token verification error:", str(e))  # Thêm log để debug
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ hoặc đã hết hạn"
        ) 