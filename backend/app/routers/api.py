from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from app.config.firebase_config import db
from app.models.user import UserCreate, UserLogin, UserResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime, timedelta
from app.utils.company_code import get_unique_company_code

router = APIRouter(
    prefix="/api",
    tags=["api"]
)

@router.get("/images")
async def get_images():
    try:
        # Lấy collection 'images' từ Firestore
        images_ref = db.collection('images')
        docs = images_ref.stream()
        
        images = []
        for doc in docs:
            images.append({
                "id": doc.id,
                **doc.to_dict()
            })
        
        return images
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images")
async def create_image(image_data: dict):
    try:
        # Thêm document mới vào collection 'images'
        doc_ref = db.collection('images').document()
        doc_ref.set(image_data)
        
        return {
            "message": "Image created successfully",
            "id": doc_ref.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/register")
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
            # Tạo company code mới cho admin
            try:
                company_code = await get_unique_company_code()
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=str(e)
                )

            # Tạo company mới cho admin
            companies_ref = db.collection('companies')
            company_data = {
                "company_name": user_data.company_name,
                "company_code": company_code,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            new_company = companies_ref.add(company_data)[1]
            company_id = new_company.id
        else:
            # Kiểm tra company_code cho user
            companies_ref = db.collection('companies')
            existing_company = companies_ref.where(
                'company_code', '==', user_data.company_code
            ).get()
            
            if not existing_company:
                raise HTTPException(
                    status_code=400,
                    detail="Mã công ty không hợp lệ"
                )
            company_id = existing_company[0].id

        # Tạo user mới
        user_dict = {
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": get_password_hash(user_data.password),
            "role": user_data.role,
            "company_id": company_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Lưu vào Firestore
        new_user_ref = users_ref.document()
        new_user_ref.set(user_dict)

        # Tạo token
        access_token = create_access_token(
            data={"sub": new_user_ref.id},
            expires_delta=timedelta(minutes=30)
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user_ref.id,
                **user_dict
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Lỗi đăng ký:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        print("Đang xử lý đăng nhập cho email:", user_data.email)
        
        # Tìm user theo email
        users_ref = db.collection('users')
        users = users_ref.where('email', '==', user_data.email).get()
        
        # Convert sang list để dễ xử lý
        users_list = list(users)
        print("Kết quả tìm kiếm user:", users_list)
        
        if not users_list:
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không đúng"
            )

        # Lấy document đầu tiên
        user = users_list[0]
        user_dict = user.to_dict()
        
        print("User data:", user_dict)  # Thêm log để kiểm tra dữ liệu

        # Kiểm tra password_hash có tồn tại không
        if 'password_hash' not in user_dict:
            raise HTTPException(
                status_code=500,
                detail="Tài khoản không hợp lệ"
            )
        
        # Kiểm tra mật khẩu
        if not verify_password(user_data.password, user_dict["password_hash"]):
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
        del user_dict["password_hash"]

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

@router.get("/auth/generate-company-code")
async def generate_company_code():
    try:
        company_code = await get_unique_company_code()
        return {"company_code": company_code}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) 

    