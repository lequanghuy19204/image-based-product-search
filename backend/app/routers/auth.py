from fastapi import APIRouter, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from app.models.user import UserCreate, UserLogin, UserResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime
from app.config.mongodb_config import users_collection, companies_collection
from app.utils.company_code import get_unique_company_code
from bson import ObjectId

auth_router = APIRouter()

@auth_router.post("/login")
async def login(user_data: UserLogin, response: Response):
    try:
        # Tìm user theo email
        user = await users_collection.find_one({"email": user_data.email})
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không đúng"
            )
            
        # Kiểm tra status của tài khoản
        if user.get('status') != 'active':
            raise HTTPException(
                status_code=401,
                detail="Tài khoản đã bị vô hiệu hóa"
            )
            
        # Kiểm tra mật khẩu
        if not verify_password(user_data.password, user['password_hash']):
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không đúng"
            )
            
        # Tạo token
        access_token = create_access_token(
            data={
                "sub": str(user["_id"]),
                "role": user["role"]
            },
            remember=user_data.remember
        )

        # Chuẩn bị user response
        user_response = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "company_id": str(user["company_id"]) if user.get("company_id") else None,
            "status": user["status"],
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else None,
            "updated_at": user["updated_at"].isoformat() if isinstance(user.get("updated_at"), datetime) else None
        }
        
        # Set CORS headers
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Origin"] = "*"  # Thay bằng domain thực tế của frontend
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi server: {str(e)}"
        )

@auth_router.post("/register")
async def register(user_data: UserCreate):
    try:
        # Kiểm tra email đã tồn tại
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

        # Kiểm tra và xử lý company
        company_id = None
        if user_data.role == "Admin":
            if not user_data.company_name:
                raise HTTPException(
                    status_code=400,
                    detail="Admin cần cung cấp tên công ty"
                )
            
            # Tạo company mới
            company_result = await companies_collection.insert_one({
                'company_name': user_data.company_name,
                'company_code': user_data.company_code,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
            company_id = company_result.inserted_id
        else:
            # Kiểm tra company_code tồn tại
            existing_company = await companies_collection.find_one({"company_code": user_data.company_code})
            if not existing_company:
                raise HTTPException(
                    status_code=400,
                    detail="Mã công ty không tồn tại"
                )
            company_id = existing_company["_id"]

        # Tạo user mới
        hashed_password = get_password_hash(user_data.password)
        new_user = {
            'username': user_data.username,
            'email': user_data.email,
            'password_hash': hashed_password,
            'role': user_data.role,
            'company_id': company_id,
            'status': "active",
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = await users_collection.insert_one(new_user)
        
        # Tạo token và response
        access_token = create_access_token(
            data={"sub": str(result.inserted_id), "role": user_data.role}
        )

        # Chuẩn bị response data
        user_response = {
            "id": str(result.inserted_id),
            "username": new_user["username"],
            "email": new_user["email"],
            "role": new_user["role"],
            "company_id": str(new_user["company_id"]),
            "status": new_user["status"],
            "created_at": new_user["created_at"].isoformat(),
            "updated_at": new_user["updated_at"].isoformat()
        }
        
        return {
            "message": "Đăng ký thành công",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Register error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi server: {str(e)}"
        )

# Thêm endpoint mới để tạo mã công ty
@auth_router.get("/generate-company-code")
async def generate_company_code():
    try:
        company_code = await get_unique_company_code()
        return {"company_code": company_code}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )