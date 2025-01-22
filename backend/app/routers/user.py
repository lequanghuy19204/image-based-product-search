from fastapi import APIRouter, HTTPException, Depends
from app.models.user import ChangePasswordRequest, UpdateProfileRequest, UserResponse
from app.utils.auth import verify_password, get_password_hash
from app.middleware.auth_middleware import verify_token
from app.config.firebase_config import db
from datetime import datetime

user_router = APIRouter()

@user_router.get("/profile")
async def get_profile(current_user: dict = Depends(verify_token)):
    try:
        # Lấy thông tin user từ Firestore
        user_ref = db.collection('users').document(current_user['sub'])
        user = user_ref.get()
        
        if not user.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        user_data = user.to_dict()
        # Loại bỏ password_hash khỏi response
        if 'password_hash' in user_data:
            del user_data['password_hash']
            
        return {
            "id": user.id,
            **user_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@user_router.put("/profile")
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra email đã tồn tại
        users_ref = db.collection('users')
        existing_users = users_ref.where('email', '==', profile_data.email).get()
        
        for user in existing_users:
            if user.id != current_user['sub']:
                raise HTTPException(
                    status_code=400,
                    detail="Email đã được sử dụng"
                )
        
        # Cập nhật thông tin
        user_ref = users_ref.document(current_user['sub'])
        user_ref.update({
            'username': profile_data.username,
            'email': profile_data.email,
            'updated_at': datetime.utcnow()
        })
        
        # Lấy thông tin user sau khi cập nhật
        updated_user = user_ref.get()
        user_data = updated_user.to_dict()
        
        if 'password_hash' in user_data:
            del user_data['password_hash']
            
        return {
            "message": "Cập nhật thông tin thành công",
            "user": {
                "id": updated_user.id,
                **user_data
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@user_router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra mật khẩu mới và xác nhận mật khẩu
        if password_data.new_password != password_data.confirm_password:
            raise HTTPException(
                status_code=400,
                detail="Mật khẩu xác nhận không khớp"
            )
            
        # Lấy thông tin user
        user_ref = db.collection('users').document(current_user['sub'])
        user = user_ref.get()
        
        if not user.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        user_data = user.to_dict()
        
        # Kiểm tra mật khẩu hiện tại
        if not verify_password(password_data.current_password, user_data['password_hash']):
            raise HTTPException(
                status_code=400,
                detail="Mật khẩu hiện tại không đúng"
            )
            
        # Cập nhật mật khẩu mới
        new_password_hash = get_password_hash(password_data.new_password)
        user_ref.update({
            'password_hash': new_password_hash,
            'updated_at': datetime.utcnow()
        })
        
        return {"message": "Đổi mật khẩu thành công"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 