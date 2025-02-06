from fastapi import APIRouter, HTTPException, Depends
from app.models.user import ChangePasswordRequest, UpdateProfileRequest, UserResponse
from app.utils.auth import verify_password, get_password_hash
from app.middleware.auth_middleware import verify_token
from app.config.mongodb_config import users_collection, companies_collection
from datetime import datetime
from bson import ObjectId

user_router = APIRouter()

@user_router.get("/profile")
async def get_profile(current_user: dict = Depends(verify_token)):
    try:
        # Lấy user từ database
        user = await users_collection.find_one({"_id": ObjectId(current_user['sub'])})
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        # Lấy thông tin company nếu có company_id
        company = None
        if user.get('company_id'):
            company = await companies_collection.find_one({"_id": ObjectId(user['company_id'])})

        # Chuẩn bị response data
        response_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"],
            "company_id": str(user["company_id"]) if user.get("company_id") else None,
            "company_name": company["company_name"] if company else None,
            "company_code": company["company_code"] if company else None,
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else None,
            "updated_at": user["updated_at"].isoformat() if isinstance(user.get("updated_at"), datetime) else None
        }

        return response_data

    except Exception as e:
        print(f"Get profile error: {str(e)}")  # Log lỗi
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy thông tin người dùng: {str(e)}"
        )

@user_router.put("/profile")
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra email đã tồn tại
        existing_user = await users_collection.find_one({
            "email": profile_data.email,
            "_id": {"$ne": ObjectId(current_user['sub'])}
        })
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )
        
        # Cập nhật thông tin
        result = await users_collection.update_one(
            {"_id": ObjectId(current_user['sub'])},
            {
                "$set": {
                    "username": profile_data.username,
                    "email": profile_data.email,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật thông tin")
        
        # Lấy thông tin user sau khi cập nhật
        updated_user = await users_collection.find_one(
            {"_id": ObjectId(current_user['sub'])},
            {"password_hash": 0}
        )
            
        return {
            "message": "Cập nhật thông tin thành công",
            "user": {
                "id": str(updated_user['_id']),
                **updated_user
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
        user = await users_collection.find_one({"_id": ObjectId(current_user['sub'])})
        
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        # Kiểm tra mật khẩu hiện tại
        if not verify_password(password_data.current_password, user['password_hash']):
            raise HTTPException(
                status_code=400,
                detail="Mật khẩu hiện tại không đúng"
            )
            
        # Cập nhật mật khẩu mới
        new_password_hash = get_password_hash(password_data.new_password)
        result = await users_collection.update_one(
            {"_id": ObjectId(current_user['sub'])},
            {
                "$set": {
                    "password_hash": new_password_hash,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật mật khẩu")
        
        return {"message": "Đổi mật khẩu thành công"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 