from fastapi import APIRouter, HTTPException, Depends
from app.models.user import ChangePasswordRequest, UpdateProfileRequest, UserResponse
from app.utils.auth import verify_password, get_password_hash
from app.middleware.auth_middleware import verify_token
from app.config.mongodb_config import users_collection, companies_collection
from datetime import datetime
from bson import ObjectId

user_router = APIRouter()

@user_router.get("/profile")
async def get_profile(token: dict = Depends(verify_token)):
    try:
        # Pipeline để join với companies collection
        pipeline = [
            {"$match": {"_id": ObjectId(token["sub"]) }},
            {
                "$lookup": {
                    "from": "companies",
                    "let": {"companyIdStr": "$company_id"},  # Lấy company_id (string) từ user
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", { "$toObjectId": "$$companyIdStr" }]
                                }
                            }
                        }
                    ],
                    "as": "company"
                }
            },
            {
                "$unwind": {
                    "path": "$company",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "username": 1,
                    "email": 1,
                    "role": 1,
                    "status": 1,
                    # Giữ company_id dưới dạng string (đã có trong dữ liệu)
                    "company_id": 1,
                    "created_at": { "$toString": "$created_at" },
                    "updated_at": { "$toString": "$updated_at" },
                    "company_name": { "$ifNull": ["$company.company_name", None] },
                    "company_code": { "$ifNull": ["$company.company_code", None] }
                }
            }
        ]
        
        user = await users_collection.aggregate(pipeline).to_list(1)
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        # Chuyển đổi _id thành id trong response
        user_data = user[0]
        user_data["id"] = str(user_data.pop("_id"))
        
        return user_data
        
    except Exception as e:
        print(f"Error in get_user_profile: {str(e)}")  # Thêm log để debug
        raise HTTPException(status_code=500, detail=str(e))

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
        update_time = datetime.utcnow()
        update_data = {
            "username": profile_data.username,
            "email": profile_data.email,
            "updated_at": update_time
        }
        
        # Thêm staff_code vào dữ liệu cập nhật nếu có
        if profile_data.staff_code is not None:
            update_data["staff_code"] = profile_data.staff_code

        result = await users_collection.update_one(
            {"_id": ObjectId(current_user['sub'])},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật thông tin")
            
        # Lấy thông tin user sau khi cập nhật
        updated_user = await users_collection.find_one(
            {"_id": ObjectId(current_user['sub'])}
        )
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        # Chuyển đổi ObjectId thành string và format dữ liệu trước khi trả về
        user_response = {
            "id": str(updated_user["_id"]),
            "username": updated_user["username"],
            "email": updated_user["email"],
            "role": updated_user["role"],
            "status": updated_user["status"],
            "staff_code": updated_user.get("staff_code"),
            "company_id": str(updated_user["company_id"]) if "company_id" in updated_user else None,
            "created_at": updated_user["created_at"].isoformat() if "created_at" in updated_user else None,
            "updated_at": updated_user["updated_at"].isoformat() if "updated_at" in updated_user else None
        }

        # Lấy thông tin công ty nếu có company_id
        if "company_id" in updated_user:
            company = await companies_collection.find_one({"_id": updated_user["company_id"]})
            if company:
                user_response["company_name"] = company.get("company_name")
                user_response["company_code"] = company.get("company_code")
            
        return {
            "message": "Cập nhật thông tin thành công",
            "user": user_response
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in update_profile: {str(e)}")  # Thêm log để debug
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