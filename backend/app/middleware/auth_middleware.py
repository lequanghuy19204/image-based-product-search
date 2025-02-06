from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime
import os
from dotenv import load_dotenv
from app.config.mongodb_config import users_collection
from bson.objectid import ObjectId

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
        
        # Chuyển ObjectId thành str trong payload
        if 'sub' in payload:
            payload['sub'] = str(payload['sub'])
            
        return payload
        
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ"
        )

async def verify_admin(token: str = Depends(verify_token)):
    try:
        # Lấy thông tin user từ token
        user = await users_collection.find_one({"_id": ObjectId(token['sub'])})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy thông tin người dùng"
            )
        
        # Kiểm tra role admin
        if user['role'] != 'Admin':
            raise HTTPException(
                status_code=403,
                detail="Bạn không có quyền truy cập"
            )
            
        return token
        
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Không thể xác thực người dùng"
        )
