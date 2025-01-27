from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List
from app.models.product import ProductResponse
from app.middleware.auth_middleware import verify_token
from app.config.firebase_config import db
from app.utils.cloudinary_helper import upload_multiple_images
from datetime import datetime

product_router = APIRouter()

@product_router.post("/", response_model=ProductResponse)
async def create_product(
    product_name: str = Form(...),
    product_code: str = Form(...),
    brand: str = Form(None),
    description: str = Form(None),
    price: float = Form(...),
    company_id: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra quyền truy cập
        user_doc = db.collection('users').document(current_user["sub"]).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        
        # Kiểm tra company_id
        if user_data["company_id"] != company_id and user_data["role"] != "Admin":
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to create product for this company"
            )

        # Upload ảnh lên Cloudinary
        image_urls = await upload_multiple_images(files, company_id)
        
        # Tạo document sản phẩm
        product_data = {
            "product_name": product_name,
            "product_code": product_code,
            "brand": brand,
            "description": description,
            "price": float(price),
            "company_id": company_id,
            "created_by": current_user["sub"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "image_urls": image_urls
        }

        # Lưu vào Firestore
        product_ref = db.collection('products').document()
        product_ref.set(product_data)

        # Trả về response
        return {
            "id": product_ref.id,
            **product_data
        }

    except Exception as e:
        print(f"Error in create_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# @product_router.get("/", response_model=List[ProductResponse])
# async def get_products(current_user: dict = Depends(verify_token)):
#     try:
#         products_ref = db.collection('products')
#         products = []
        
#         # Nếu user không phải admin, chỉ lấy sản phẩm của company của họ
#         user_doc = db.collection('users').document(current_user["sub"]).get()
#         user_data = user_doc.to_dict()
        
#         if user_data["role"] != "Admin":
#             query = products_ref.where("company_id", "==", user_data["company_id"])
#         else:
#             query = products_ref
            
#         for doc in query.stream():
#             products.append({
#                 "id": doc.id,
#                 **doc.to_dict()
#             })
            
#         return products
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e)) 