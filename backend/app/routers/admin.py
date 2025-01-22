from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token, verify_admin
from app.config.firebase_config import db

admin_router = APIRouter()

# Route quản lý người dùng (chỉ admin)
@admin_router.get("/users")
async def get_users():
    try:
        users_ref = db.collection('users')
        users = users_ref.get()
        
        users_list = []
        for user in users:
            user_data = user.to_dict()
            if 'password_hash' in user_data:
                del user_data['password_hash']
            users_list.append({
                "id": user.id,
                **user_data
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

