from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.product import ProductCreate, ProductUpdate, ProductResponse
from app.middleware.auth_middleware import verify_token
from app.config.firebase_config import db
from datetime import datetime
from google.cloud import firestore
import math
from google.cloud.firestore_v1.base_query import FieldFilter
from app.utils.image_processing import process_image

product_router = APIRouter()

@product_router.post("/", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(verify_token)
):
    try:
        # Lấy thông tin user
        user_doc = db.collection('users').document(current_user["sub"]).get()
        user_data = user_doc.to_dict()
        
        # Tạo document sản phẩm mới
        doc_ref = db.collection('products').document()
        product_dict = {
            **product_data.dict(),
            'created_by': current_user['sub'],
            'created_by_name': user_data.get('username', 'Unknown'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        doc_ref.set(product_dict)
        
        # Tạo các documents ảnh với đặc trưng và hash
        batch = db.batch()
        for url in product_data.image_urls:
            # Trích xuất đặc trưng và tính hash
            features, image_hash = process_image(url)
            
            image_ref = db.collection('images').document()
            image_data = {
                'image_url': url,
                'company_id': product_data.company_id,
                'product_id': doc_ref.id,
                'uploaded_by': current_user['sub'],
                'created_at': datetime.utcnow(),
                'features': features,
                'image_hash': image_hash
            }
            batch.set(image_ref, image_data)
        
        # Thực hiện batch write
        batch.commit()
        
        return {
            'id': doc_ref.id,
            **product_dict
        }
    except Exception as e:
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
    search_field: str = 'all',
    page: int = 1,
    limit: int = 10,
    company_id: str = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    try:
        # Lấy thông tin user
        user_doc = db.collection('users').document(current_user["sub"]).get()
        user_data = user_doc.to_dict()

        # Sử dụng company_id từ user nếu không có trong request
        company_id = company_id or user_data.get("company_id")
        if not company_id:
            raise HTTPException(status_code=400, detail="Company ID is required")

        # Tạo query với filter theo company_id
        products_ref = db.collection('products').where(
            filter=FieldFilter("company_id", "==", company_id)
        )

        # Thêm điều kiện tìm kiếm
        if search:
            if search_field == 'code':
                products_ref = products_ref.where(
                    filter=FieldFilter("product_code", "==", search)
                )
            elif search_field == 'name':
                products_ref = products_ref.where(
                    filter=FieldFilter("product_name", ">=", search)
                ).where(
                    filter=FieldFilter("product_name", "<=", search + '\uf8ff')
                )
            elif search_field == 'creator':
                # Tìm user theo username
                users_ref = db.collection('users').where(
                    filter=FieldFilter("username", ">=", search)
                ).where(
                    filter=FieldFilter("username", "<=", search + '\uf8ff')
                )
                users = users_ref.stream()
                user_ids = [user.id for user in users]
                
                if user_ids:
                    products_ref = products_ref.where(
                        filter=FieldFilter("created_by", "in", user_ids)
                    )
            elif search_field == 'price':
                try:
                    price = float(search)
                    products_ref = products_ref.where(
                        filter=FieldFilter("price", "==", price)
                    )
                except ValueError:
                    raise HTTPException(status_code=400, detail="Giá phải là số")

        # Sắp xếp
        if sort_by and sort_order:
            if sort_order.lower() == "asc":
                products_ref = products_ref.order_by(sort_by, direction=firestore.Query.ASCENDING)
            else:
                products_ref = products_ref.order_by(sort_by, direction=firestore.Query.DESCENDING)

        # Đếm tổng số sản phẩm
        total_query = products_ref.count()
        total_docs = total_query.get()[0][0].value

        # Phân trang
        products_ref = products_ref.offset((page - 1) * limit)\
                                 .limit(limit)

        # Thực hiện query và xử lý kết quả
        products = []
        user_refs = {}
        
        # Lấy documents
        docs = list(products_ref.stream())
        
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
    product_data: ProductUpdate,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product_doc = db.collection('products').document(product_id).get()
        if not product_doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        existing_data = product_doc.to_dict()
        
        # Kiểm tra quyền
        await check_user_permission(current_user, existing_data["company_id"])
        
        # Cập nhật dữ liệu
        update_data = {
            k: v for k, v in product_data.dict(exclude_unset=True).items()
            if v is not None
        }
        update_data["updated_at"] = datetime.utcnow()
        
        # Cập nhật sản phẩm
        db.collection('products').document(product_id).update(update_data)
        
        return {
            "id": product_id,
            **{**existing_data, **update_data}
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