from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List
from app.models.product import ProductResponse
from app.middleware.auth_middleware import verify_token
from app.config.firebase_config import db
from app.utils.cloudinary_helper import upload_image, upload_multiple_images
from datetime import datetime
from google.cloud import firestore
import math
import json
import asyncio

product_router = APIRouter()

@product_router.post("/", response_model=ProductResponse)
async def create_product(
    product_name: str = Form(...),
    product_code: str = Form(...),
    brand: str = Form(None),
    description: str = Form(None),
    price: float = Form(...),
    company_id: str = Form(...),
    image_urls: str = Form("[]"),  # JSON string của các URL đã upload
    current_user: dict = Depends(verify_token)
):
    try:
        # Parse image_urls từ JSON string
        image_urls_list = json.loads(image_urls)
        
        # Kiểm tra quyền
        await check_user_permission(current_user, company_id)
        
        # Tạo transaction để đảm bảo tính nhất quán của dữ liệu
        transaction = db.transaction()
        
        @firestore.transactional
        def create_product_in_transaction(transaction):
            # 1. Tạo document sản phẩm
            product_ref = db.collection('products').document()
            product_id = product_ref.id
            
            now = datetime.utcnow()
            product_data = {
                "product_name": product_name,
                "product_code": product_code,
                "brand": brand,
                "description": description,
                "price": float(price),
                "company_id": company_id,
                "created_by": current_user["sub"],
                "created_at": now,
                "updated_at": now,
                "image_urls": image_urls_list
            }
            
            # 2. Tạo các documents ảnh
            image_refs = []
            for url in image_urls_list:
                image_ref = db.collection('images').document()
                image_data = {
                    "image_url": url,
                    "company_id": company_id,
                    "product_id": product_id,
                    "uploaded_by": current_user["sub"],
                    "created_at": now
                }
                image_refs.append((image_ref, image_data))
            
            # 3. Thực hiện ghi dữ liệu trong transaction
            transaction.set(product_ref, product_data)
            for image_ref, image_data in image_refs:
                transaction.set(image_ref, image_data)
            
            return {
                "id": product_id,
                **product_data
            }
        
        # Thực hiện transaction
        result = create_product_in_transaction(transaction)
        return result

    except Exception as e:
        print(f"Error in create_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def check_user_permission(current_user: dict, company_id: str):
    """Kiểm tra quyền của user"""
    user_doc = db.collection('users').document(current_user["sub"]).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_doc.to_dict()
    if user_data["company_id"] != company_id and user_data["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return user_data

@product_router.get("/", response_model=dict)
async def get_products(
    current_user: dict = Depends(verify_token),
    search: str = None,
    page: int = 1,
    limit: int = 10,
    company_id: str = None
):
    try:
        # Lấy thông tin user
        user_doc = db.collection('users').document(current_user["sub"]).get()
        user_data = user_doc.to_dict()

        # Tạo query cơ bản
        products_ref = db.collection('products')
        
        # Filter theo company_id từ request hoặc từ user data
        company_id = company_id or user_data.get("company_id")
        if not company_id:
            raise HTTPException(status_code=400, detail="Company ID is required")
            
        products_ref = products_ref.where("company_id", "==", company_id)

        # Tối ưu query bằng cách thêm composite index
        if search:
            products_ref = products_ref.where("product_name", ">=", search)\
                                    .where("product_name", "<=", search + '\uf8ff')

        # Đếm tổng số sản phẩm
        total_query = products_ref.count()
        total_docs = total_query.get()[0][0].value

        # Sắp xếp và giới hạn kết quả
        products_ref = products_ref.order_by("created_at", direction=firestore.Query.DESCENDING)\
                                 .offset((page - 1) * limit)\
                                 .limit(limit)

        # Thực hiện query và xử lý kết quả
        products = []
        user_refs = {}
        
        # Lấy documents
        docs = list(products_ref.stream())  # Convert to list để có thể dùng nhiều lần
        
        # Thu thập user references
        for doc in docs:
            product_data = doc.to_dict()
            created_by = product_data.get("created_by")
            if created_by and created_by not in user_refs:
                user_refs[created_by] = db.collection('users').document(created_by)

        # Lấy thông tin users trong một lần gọi
        if user_refs:
            user_docs = db.get_all(list(user_refs.values()))
            user_data_map = {
                doc.id: doc.to_dict() 
                for doc in user_docs 
                if doc.exists
            }

        # Xử lý products
        for doc in docs:
            product_data = doc.to_dict()
            product_data["id"] = doc.id
            
            # Thêm thông tin người tạo
            created_by = product_data.get("created_by")
            if created_by:
                creator = user_data_map.get(created_by, {})
                product_data["created_by_name"] = creator.get("username", "Unknown")
            
            products.append(product_data)

        return {
            "data": products,
            "total": total_docs,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total_docs / limit)
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

@product_router.post("/upload", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    current_user: dict = Depends(verify_token)
):
    try:
        # Sử dụng hàm upload_image từ cloudinary_helper
        url = await upload_image(file, company_id)
        
        # Lưu thông tin ảnh vào collection images
        image_ref = db.collection('images').document()
        image_data = {
            'image_url': url,
            'company_id': company_id,
            'uploaded_by': current_user['sub'],
            'created_at': datetime.utcnow()
        }
        image_ref.set(image_data)
        
        return {'url': url}
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi upload ảnh: {str(e)}") 