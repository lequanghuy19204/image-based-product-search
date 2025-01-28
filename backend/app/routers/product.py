from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List
from app.models.product import ProductResponse
from app.middleware.auth_middleware import verify_token
from app.config.firebase_config import db
from app.utils.cloudinary_helper import upload_multiple_images
from datetime import datetime
from google.cloud import firestore
import math
import json

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
        # Lấy thông tin user
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

        # Tạo batch để thực hiện nhiều thao tác cùng lúc
        batch = db.batch()

        # Tạo document sản phẩm
        product_ref = db.collection('products').document()
        batch.set(product_ref, product_data)

        # Tạo documents cho từng ảnh trong collection images
        for image_url in image_urls:
            image_ref = db.collection('images').document()
            image_data = {
                "image_url": image_url,
                "company_id": company_id,
                "product_id": product_ref.id,
                "uploaded_by": current_user["sub"],
                "created_at": datetime.utcnow()
            }
            batch.set(image_ref, image_data)

        # Thực hiện tất cả các thao tác trong batch
        batch.commit()

        # Trả về response
        return {
            "id": product_ref.id,
            **product_data
        }

    except Exception as e:
        print(f"Error in create_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/", response_model=dict)
async def get_products(
    current_user: dict = Depends(verify_token),
    search: str = None,
    page: int = 1,
    limit: int = 10
):
    try:
        # Lấy thông tin user
        user_doc = db.collection('users').document(current_user["sub"]).get()
        user_data = user_doc.to_dict()

        # Tạo query cơ bản
        products_ref = db.collection('products')
        
        # Nếu không phải admin, chỉ lấy sản phẩm của company
        if user_data["role"] != "Admin":
            products_ref = products_ref.where("company_id", "==", user_data["company_id"])

        # Thêm điều kiện tìm kiếm nếu có
        if search:
            products_ref = products_ref.where("product_name", ">=", search)\
                                    .where("product_name", "<=", search + '\uf8ff')

        # Sắp xếp theo thời gian tạo mới nhất
        products_ref = products_ref.order_by("created_at", direction=firestore.Query.DESCENDING)

        # Đếm tổng số sản phẩm để phân trang
        total_docs = len(products_ref.get())
        total_pages = math.ceil(total_docs / limit)

        # Tính toán phân trang
        start = (page - 1) * limit
        products_ref = products_ref.limit(limit).offset(start)

        # Lấy danh sách sản phẩm
        products = []
        docs = products_ref.get()
        
        for doc in docs:
            product_data = doc.to_dict()
            product_data["id"] = doc.id

            # Lấy thông tin người tạo
            creator_doc = db.collection('users').document(product_data["created_by"]).get()
            if creator_doc.exists:
                creator_data = creator_doc.to_dict()
                product_data["created_by_name"] = creator_data.get("username", "Unknown")
            else:
                product_data["created_by_name"] = "Unknown"

            # Lấy thông tin ảnh của sản phẩm
            images_ref = db.collection('images')\
                          .where("product_id", "==", doc.id)\
                          .order_by("created_at", direction=firestore.Query.DESCENDING)
            
            images = []
            image_docs = images_ref.get()
            for img_doc in image_docs:
                images.append(img_doc.to_dict()["image_url"])
            
            product_data["image_urls"] = images
            products.append(product_data)

        return {
            "data": products,
            "total": total_docs,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }

    except Exception as e:
        print(f"Error getting products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_name: str = Form(...),
    product_code: str = Form(...),
    brand: str = Form(None),
    description: str = Form(None),
    price: float = Form(...),
    company_id: str = Form(...),
    existing_image_urls: str = Form("[]"),  # JSON string của các URL hiện có
    files: List[UploadFile] = File([]),  # Optional files
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product_doc = db.collection('products').document(product_id).get()
        if not product_doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_data = product_doc.to_dict()
        
        # Kiểm tra quyền
        if product_data["company_id"] != company_id and current_user["role"] != "Admin":
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to update this product"
            )

        # Upload ảnh mới nếu có
        new_image_urls = []
        if files:
            new_image_urls = await upload_multiple_images(files, company_id)

        # Kết hợp ảnh cũ và mới
        existing_urls = json.loads(existing_image_urls)
        all_image_urls = existing_urls + new_image_urls

        # Cập nhật dữ liệu sản phẩm
        update_data = {
            "product_name": product_name,
            "product_code": product_code,
            "brand": brand,
            "description": description,
            "price": float(price),
            "updated_at": datetime.utcnow(),
            "image_urls": all_image_urls
        }

        # Cập nhật sản phẩm
        db.collection('products').document(product_id).update(update_data)

        # Trả về response
        return {
            "id": product_id,
            **update_data,
            "company_id": company_id,
            "created_by": product_data["created_by"],
            "created_at": product_data["created_at"]
        }

    except Exception as e:
        print(f"Error in update_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product_doc = db.collection('products').document(product_id).get()
        if not product_doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_data = product_doc.to_dict()
        
        # Kiểm tra quyền
        user_doc = db.collection('users').document(current_user["sub"]).get()
        user_data = user_doc.to_dict()
        
        if product_data["company_id"] != user_data["company_id"] and user_data["role"] != "Admin":
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this product"
            )

        # Tạo batch để xóa nhiều documents
        batch = db.batch()

        # Xóa tất cả ảnh liên quan
        images_ref = db.collection('images').where("product_id", "==", product_id)
        images = images_ref.get()
        
        for image in images:
            batch.delete(image.reference)

        # Xóa sản phẩm
        product_ref = db.collection('products').document(product_id)
        batch.delete(product_ref)

        # Thực hiện batch
        batch.commit()

        return {"message": "Product deleted successfully"}

    except Exception as e:
        print(f"Error in delete_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 