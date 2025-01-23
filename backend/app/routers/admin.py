from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token, verify_admin
from app.config.firebase_config import db
from datetime import datetime

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
        
        # Nếu user có company_id, chỉ lấy users cùng công ty
        if company_id:
            users = users_ref.where('company_id', '==', company_id).get()
        else:
            # Nếu không có company_id (super admin), lấy tất cả users
            users = users_ref.get()
        
        users_list = []
        for user in users:
            user_data = user.to_dict()
            
            # Loại bỏ password_hash khỏi response
            if 'password_hash' in user_data:
                del user_data['password_hash']
            
            # Lấy thông tin công ty nếu có
            company_data = {}
            if user_data.get('company_id'):
                company_doc = db.collection('companies').document(user_data['company_id']).get()
                if company_doc.exists:
                    company_data = company_doc.to_dict()
            
            users_list.append({
                "id": user.id,
                **user_data,
                "company_name": company_data.get('company_name', ''),
                "company_code": company_data.get('company_code', '')
            })
            
        return users_list
        
    except Exception as e:
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

