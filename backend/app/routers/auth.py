from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserLogin, UserResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime, timedelta
from app.config.firebase_config import db
from app.utils.company_code import get_unique_company_code

auth_router = APIRouter()

@auth_router.post("/login")
async def login(user_data: UserLogin):
    try:
        # Tìm user theo email
        users_ref = db.collection('users')
        users = users_ref.where('email', '==', user_data.email).get()
        
        if not users:
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không đúng"
            )
            
        user = users[0]
        user_dict = user.to_dict()
        
        # Kiểm tra status của tài khoản
        if user_dict.get('status') != 'active':
            raise HTTPException(
                status_code=401,
                detail="Tài khoản đã bị vô hiệu hóa"
            )
            
        # Kiểm tra mật khẩu
        if not verify_password(user_data.password, user_dict['password_hash']):
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không đúng"
            )
            
        # Tạo token
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=30)
        )
        
        # Loại bỏ password_hash khỏi response
        if 'password_hash' in user_dict:
            del user_dict['password_hash']
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                **user_dict
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Lỗi đăng nhập:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.post("/register")
async def register(user_data: UserCreate):
    try:
        # Kiểm tra email đã tồn tại
        users_ref = db.collection('users')
        existing_users = users_ref.where('email', '==', user_data.email).get()
        
        if len(list(existing_users)) > 0:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

        # Xử lý company
        company_id = None
        if user_data.role == "Admin":
            if not user_data.company_name:
                raise HTTPException(
                    status_code=400,
                    detail="Admin cần cung cấp tên công ty"
                )
                
            # Tạo company code
            company_code = await get_unique_company_code()
            
            # Tạo company mới
            company_ref = db.collection('companies').document()
            company_ref.set({
                'company_name': user_data.company_name,
                'company_code': company_code,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
            
            company_id = company_ref.id
            
        elif user_data.company_code:
            # Tìm company theo code
            companies = db.collection('companies').where('company_code', '==', user_data.company_code).get()
            
            if not companies:
                raise HTTPException(
                    status_code=400,
                    detail="Mã công ty không hợp lệ"
                )
                
            company_id = companies[0].id

        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Tạo user mới
        user_ref = db.collection('users').document()
        user_data_dict = {
            'username': user_data.username,
            'email': user_data.email,
            'password_hash': password_hash,
            'role': user_data.role,
            'company_id': company_id,
            'status': "active",
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        user_ref.set(user_data_dict)
        
        # Loại bỏ password_hash khỏi response
        del user_data_dict['password_hash']
        
        return {
            "message": "Đăng ký thành công",
            "user": {
                "id": user_ref.id,
                **user_data_dict
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
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