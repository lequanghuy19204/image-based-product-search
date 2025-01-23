from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token, verify_admin
from app.config.firebase_config import db
from datetime import datetime
from google.cloud import firestore
from app.models.user import UserCreate, UserStatusUpdate
from app.utils.auth import get_password_hash

admin_router = APIRouter()

# Route quản lý người dùng (chỉ admin)
@admin_router.get("/users")
async def get_users(current_user: dict = Depends(verify_admin)):
    try:
        users_ref = db.collection('users')
        
        # Lấy thông tin công ty của user hiện tại
        current_user_doc = db.collection('users').document(current_user['sub']).get()
        current_user_data = current_user_doc.to_dict()
        company_id = current_user_data.get('company_id')
        
        # Tối ưu hóa truy vấn bằng cách sử dụng index
        query = users_ref
        if company_id:
            query = query.where('company_id', '==', company_id)
        
        # Thêm ordering để tận dụng index
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Thực hiện truy vấn
        users = query.get()
        
        # Lấy danh sách company_ids từ users
        company_ids = set()
        for user in users:
            user_data = user.to_dict()
            if user_data.get('company_id'):
                company_ids.add(user_data['company_id'])
        
        # Lấy thông tin companies trong một lần query
        companies_data = {}
        if company_ids:
            # Sử dụng 'in' operator thay vì document_id
            companies = db.collection('companies').where(
                '__name__', 'in', list(company_ids)
            ).get()
            companies_data = {
                company.id: company.to_dict() 
                for company in companies
            }
        
        users_list = []
        for user in users:
            user_data = user.to_dict()
            if 'password_hash' in user_data:
                del user_data['password_hash']
            
            company_data = {}
            if user_data.get('company_id'):
                company_data = companies_data.get(user_data['company_id'], {})
            
            users_list.append({
                "id": user.id,
                **user_data,
                "company_name": company_data.get('company_name', ''),
                "company_code": company_data.get('company_code', '')
            })
            
        return users_list
        
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Route cho cả admin và user
@admin_router.get("/products")
async def get_products(current_user: dict = Depends(verify_token)):
    try:
        products_ref = db.collection('products')
        products = products_ref.get()
        
        products_list = []
        for product in products:
            products_list.append({
                "id": product.id,
                **product.to_dict()
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
        product_ref = db.collection('products').document(product_id)
        product_ref.delete()
        return {"message": "Xóa sản phẩm thành công"}
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
        user_ref = db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        # Cập nhật status
        user_ref.update({
            'status': status_data.status,
            'updated_at': datetime.utcnow()
        })
        
        # Trả về user đã cập nhật
        updated_user = user_ref.get()
        return {
            "id": updated_user.id,
            **updated_user.to_dict()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
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
        user_ref = db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        # Cập nhật role
        user_ref.update({
            'role': role_data['role'],
            'updated_at': datetime.utcnow()
        })
        
        return {"message": "Cập nhật quyền thành công"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/users")
async def create_user(user_data: UserCreate, current_user: dict = Depends(verify_admin)):
    try:
        # Kiểm tra email đã tồn tại
        users_ref = db.collection('users')
        existing_users = users_ref.where('email', '==', user_data.email).get()
        
        if len(list(existing_users)) > 0:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

        # Lấy thông tin công ty của admin hiện tại
        admin_doc = db.collection('users').document(current_user['sub']).get()
        admin_data = admin_doc.to_dict()
        company_id = admin_data.get('company_id')

        if not company_id:
            raise HTTPException(
                status_code=400,
                detail="Admin chưa được gán công ty"
            )

        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Tạo user mới với company_id của admin
        user_ref = db.collection('users').document()
        new_user_data = {
            'username': user_data.username,
            'email': user_data.email,
            'password_hash': password_hash,
            'role': user_data.role,
            'company_id': company_id,
            'status': "active",
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        user_ref.set(new_user_data)
        
        # Lấy thông tin company để trả về
        company_doc = db.collection('companies').document(company_id).get()
        company_data = company_doc.to_dict()

        # Chuẩn bị response data (không bao gồm password_hash)
        response_data = {
            'id': user_ref.id,
            'username': user_data.username,
            'email': user_data.email,
            'role': user_data.role,
            'status': "active",
            'company_name': company_data.get('company_name', ''),
            'company_code': company_data.get('company_code', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
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
        user_ref = db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        # Kiểm tra email đã tồn tại (nếu có thay đổi email)
        if 'email' in user_data:
            existing_users = db.collection('users').where('email', '==', user_data['email']).get()
            for existing_user in existing_users:
                if existing_user.id != user_id:
                    raise HTTPException(
                        status_code=400,
                        detail="Email đã được sử dụng"
                    )

        # Cập nhật thông tin
        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        allowed_fields = ['username', 'email', 'role']
        for field in allowed_fields:
            if field in user_data:
                update_data[field] = user_data[field]

        user_ref.update(update_data)
        
        # Lấy thông tin user sau khi cập nhật
        updated_user = user_ref.get()
        updated_data = updated_user.to_dict()
        
        # Lấy thông tin company
        company_data = {}
        if updated_data.get('company_id'):
            company_doc = db.collection('companies').document(updated_data['company_id']).get()
            if company_doc.exists:
                company_data = company_doc.to_dict()

        # Loại bỏ password_hash khỏi response
        if 'password_hash' in updated_data:
            del updated_data['password_hash']

        return {
            'id': updated_user.id,
            **updated_data,
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
        user_ref = db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        # Không cho phép xóa chính mình
        if user_id == current_user['sub']:
            raise HTTPException(
                status_code=400,
                detail="Không thể xóa tài khoản của chính mình"
            )

        # Thực hiện xóa
        user_ref.delete()
        
        return {"message": "Xóa người dùng thành công"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

