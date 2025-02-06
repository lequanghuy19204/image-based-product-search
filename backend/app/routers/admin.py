from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token, verify_admin
from app.config.mongodb_config import users_collection, companies_collection, products_collection
from datetime import datetime
from app.models.user import UserCreate, UserStatusUpdate
from app.utils.auth import get_password_hash
from bson import ObjectId

admin_router = APIRouter()

# Route quản lý người dùng (chỉ admin)
@admin_router.get("/users")
async def get_users(current_user: dict = Depends(verify_admin)):
    try:
        # Lấy thông tin user hiện tại
        current_user_data = await users_collection.find_one({"_id": ObjectId(current_user['sub'])})
        if not current_user_data:
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin người dùng")
            
        company_id = current_user_data.get('company_id')
        if not company_id:
            raise HTTPException(status_code=400, detail="Người dùng chưa được gán công ty")

        # Lấy danh sách users cùng company
        users_cursor = users_collection.find({"company_id": company_id})
        users = await users_cursor.to_list(None)
        
        # Format response
        formatted_users = [
            {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "status": user.get("status", "active"),
                "company_id": user["company_id"],
                "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
                "updated_at": user.get("updated_at", datetime.utcnow()).isoformat()
            }
            for user in users
        ]
        
        return formatted_users
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Route cho cả admin và user
@admin_router.get("/products")
async def get_products(current_user: dict = Depends(verify_token)):
    try:
        products_ref = products_collection.find()
        products = await products_ref.to_list(None)
        
        products_list = []
        for product in products:
            products_list.append({
                "id": product['_id'],
                **product
            })
            
        return products_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Route chỉ cho admin
@admin_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(verify_admin)  # Sử dụng verify_admin
):
    try:
        product_ref = products_collection.find_one({"_id": ObjectId(product_id)})
        if product_ref:
            result = products_collection.delete_one({"_id": ObjectId(product_id)})
            if result.deleted_count > 0:
                return {"message": "Xóa sản phẩm thành công"}
            else:
                raise HTTPException(status_code=400, detail="Không thể xóa sản phẩm")
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Thêm route để cập nhật trạng thái người dùng
@admin_router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    current_user: dict = Depends(verify_admin)
):
    try:
        # Kiểm tra user tồn tại
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        # Cập nhật status
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "status": status_data.status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật trạng thái")
        
        # Lấy thông tin user đã cập nhật
        updated_user = await users_collection.find_one(
            {"_id": ObjectId(user_id)},
            {"password_hash": 0}
        )
        return updated_user
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: dict,
    current_user: dict = Depends(verify_admin)
):
    try:
        # Kiểm tra user cần update có tồn tại không
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        # Cập nhật role
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "role": role_data['role'],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật quyền")
        
        return {"message": "Cập nhật quyền thành công"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/users")
async def create_user(user_data: UserCreate, current_user: dict = Depends(verify_admin)):
    try:
        # Kiểm tra email đã tồn tại
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng")

        # Lấy thông tin admin hiện tại
        admin = await users_collection.find_one({"_id": ObjectId(current_user['sub'])})
        company_id = admin.get('company_id')

        if not company_id:
            raise HTTPException(status_code=400, detail="Admin chưa được gán công ty")

        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Tạo user mới
        new_user = {
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": password_hash,
            "role": user_data.role,
            "company_id": company_id,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await users_collection.insert_one(new_user)
        
        # Lấy thông tin company
        company = await companies_collection.find_one({"_id": ObjectId(company_id)})
        
        # Chuẩn bị response data
        response_data = {
            "id": str(result.inserted_id),
            **new_user,
            "company_name": company.get('company_name', ''),
            "company_code": company.get('company_code', '')
        }
        del response_data['password_hash']
        
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: dict,
    current_user: dict = Depends(verify_admin)
):
    try:
        # Kiểm tra user tồn tại
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        # Kiểm tra email đã tồn tại (nếu có thay đổi email)
        if 'email' in user_data:
            existing_user = await users_collection.find_one({"email": user_data['email']})
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email đã được sử dụng"
                )

        # Cập nhật thông tin
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        allowed_fields = ['username', 'email', 'role']
        for field in allowed_fields:
            if field in user_data:
                update_data[field] = user_data[field]

        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": update_data
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật thông tin")
        
        # Lấy thông tin user sau khi cập nhật
        updated_user = await users_collection.find_one(
            {"_id": ObjectId(user_id)},
            {"password_hash": 0}
        )
        
        # Lấy thông tin company
        company_data = {}
        if updated_user.get('company_id'):
            company = await companies_collection.find_one({"_id": ObjectId(updated_user['company_id'])})
            if company:
                company_data = company

        return {
            'id': updated_user['_id'],
            **updated_user,
            'company_name': company_data.get('company_name', ''),
            'company_code': company_data.get('company_code', '')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(verify_admin)
):
    try:
        # Kiểm tra user tồn tại
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        # Không cho phép xóa chính mình
        if user_id == current_user['sub']:
            raise HTTPException(
                status_code=400,
                detail="Không thể xóa tài khoản của chính mình"
            )

        # Thực hiện xóa
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count > 0:
            return {"message": "Xóa người dùng thành công"}
        else:
            raise HTTPException(status_code=400, detail="Không thể xóa người dùng")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

