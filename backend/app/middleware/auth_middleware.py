from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime
import os
from dotenv import load_dotenv
from app.config.firebase_config import db

# Load biến môi trường
load_dotenv()

# Lấy SECRET_KEY từ biến môi trường
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

# Tạo instance của HTTPBearer
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token and return decoded payload
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Kiểm tra thời hạn token
        exp = payload.get("exp")
        if exp is None:
            raise HTTPException(
                status_code=401,
                detail="Token không hợp lệ"
            )
            
        if datetime.utcfromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=401,
                detail="Token đã hết hạn"
            )
            
        return payload
        
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ"
        )

async def verify_admin(credentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET_KEY"),
            algorithms=["HS256"]
        )
        
        # Lấy thông tin user từ database
        user_doc = db.collection('users').document(payload['sub']).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        user_data = user_doc.to_dict()
        
        # Kiểm tra role admin
        if user_data.get('role') != 'Admin':
            raise HTTPException(
                status_code=403,
                detail="Bạn không có quyền truy cập"
            )
            
        return payload
        
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ hoặc đã hết hạn"
        )
