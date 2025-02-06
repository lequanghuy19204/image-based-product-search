from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.product import ProductCreate, ProductUpdate, ProductResponse
from app.middleware.auth_middleware import verify_token
from app.config.mongodb_config import users_collection, products_collection, images_collection
from datetime import datetime
from bson import ObjectId
from app.utils.image_processing import process_image
import logging
import asyncio
import math

# Khai báo logger
logger = logging.getLogger(__name__)

product_router = APIRouter()

@product_router.post("/", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(verify_token)
):
    try:
        # Lấy thông tin user
        user = await users_collection.find_one({"_id": ObjectId(current_user["sub"])})
        
        # Tạo document sản phẩm mới
        product_dict = {
            **product_data.dict(exclude={'features', 'image_hashes'}),
            'created_by': current_user['sub'],
            'created_by_name': user.get('username', 'Unknown'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Lưu sản phẩm
        result = await products_collection.insert_one(product_dict)
        product_id = str(result.inserted_id)
        
        # Tạo task xử lý ảnh bất đồng bộ
        async def process_images():
            try:
                image_tasks = []
                for url in product_data.image_urls:
                    features, image_hash = process_image(url)
                    if features and image_hash:
                        image_tasks.append({
                            'image_url': url,
                            'company_id': product_data.company_id,
                            'product_id': product_id,
                            'uploaded_by': current_user['sub'],
                            'created_at': datetime.utcnow(),
                            'features': features,
                            'image_hash': image_hash
                        })

                # Batch insert cho images nếu có
                if image_tasks:
                    await images_collection.insert_many(image_tasks)
                    
            except Exception as e:
                logger.error(f"Error processing images: {str(e)}")

        # Chạy xử lý ảnh bất đồng bộ
        asyncio.create_task(process_images())
        
        # Trả về response ngay
        return {
            'id': product_id,
            **product_dict
        }

    except Exception as e:
        logger.error(f"Error in create_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
        user = await users_collection.find_one({"_id": ObjectId(current_user["sub"])})
        
        # Sử dụng company_id từ user nếu không có trong request
        company_id = company_id or user.get("company_id")
        if not company_id:
            raise HTTPException(status_code=400, detail="Company ID is required")

        # Tạo filter
        filter_query = {"company_id": company_id}

        # Thêm điều kiện tìm kiếm
        if search:
            if search_field == 'code':
                filter_query["product_code"] = search
            elif search_field == 'name':
                filter_query["product_name"] = {"$regex": search, "$options": "i"}
            elif search_field == 'creator':
                users = await users_collection.find(
                    {"username": {"$regex": search, "$options": "i"}}
                ).to_list(None)
                user_ids = [str(user['_id']) for user in users]
                if user_ids:
                    filter_query["created_by"] = {"$in": user_ids}
            elif search_field == 'price':
                try:
                    filter_query["price"] = float(search)
                except ValueError:
                    raise HTTPException(status_code=400, detail="Giá phải là số")

        # Tạo sort
        sort_direction = -1 if sort_order.lower() == "desc" else 1
        sort_query = [(sort_by, sort_direction)]

        # Đếm tổng số sản phẩm
        total = await products_collection.count_documents(filter_query)

        # Lấy sản phẩm theo phân trang
        products_cursor = products_collection.find(filter_query)\
            .sort(sort_query)\
            .skip((page - 1) * limit)\
            .limit(limit)

        products = await products_cursor.to_list(None)

        # Lấy thông tin người tạo
        creator_ids = list(set(str(p['created_by']) for p in products))
        creators = await users_collection.find(
            {"_id": {"$in": [ObjectId(id) for id in creator_ids]}}
        ).to_list(None)
        creators_map = {str(c['_id']): c['username'] for c in creators}

        # Thêm thông tin người tạo vào products
        for product in products:
            product['id'] = str(product['_id'])
            product['created_by_name'] = creators_map.get(str(product['created_by']), "Unknown")

        return {
            "data": products,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total / limit)
        }

    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product_doc = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product_doc:
            raise HTTPException(status_code=404, detail="Product not found")
        
        existing_data = product_doc
        
        # Kiểm tra quyền
        await check_user_permission(current_user, existing_data["company_id"])
        
        # Tạo batch để xử lý nhiều thao tác
        batch = []
        
        # Cập nhật thông tin sản phẩm
        update_data = {
            k: v for k, v in product_data.dict(exclude_unset=True).items()
            if v is not None
        }
        update_data["updated_at"] = datetime.utcnow()
        
        # Nếu có cập nhật ảnh
        if "image_urls" in update_data:
            new_image_urls = set(update_data["image_urls"])
            old_image_urls = set(existing_data.get("image_urls", []))
            
            # Xác định ảnh thêm mới và ảnh bị xóa
            added_images = new_image_urls - old_image_urls
            removed_images = old_image_urls - new_image_urls
            
            # Xóa các ảnh cũ trong collection images
            if removed_images:
                batch.append({
                    "q": {"image_url": {"$in": list(removed_images)}},
                    "u": {"$pull": {"image_urls": {"$in": list(removed_images)}}},
                    "p": {"$set": {"updated_at": datetime.utcnow()}}
                })
            
            # Thêm các ảnh mới vào collection images
            if added_images:
                for url in added_images:
                    features, image_hash = process_image(url)
                    if features and image_hash:
                        batch.append({
                            "i": {
                                "image_url": url,
                                "company_id": existing_data["company_id"],
                                "product_id": product_id,
                                "uploaded_by": current_user['sub'],
                                "created_at": datetime.utcnow(),
                                "features": features,
                                "image_hash": image_hash
                            },
                            "u": {"$push": {"image_urls": url}},
                            "p": {"$set": {"updated_at": datetime.utcnow()}}
                        })
        
        # Cập nhật document sản phẩm
        await products_collection.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
        
        # Thực hiện tất cả các thao tác trong batch
        if batch:
            await images_collection.bulk_write(batch)
        
        # Trả về dữ liệu đã cập nhật
        return {
            "id": product_id,
            **{**existing_data, **update_data}
        }

    except Exception as e:
        logger.error(f"Error in update_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product_doc = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product_doc:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Kiểm tra quyền
        await check_user_permission(current_user, product_doc["company_id"])

        # Tạo batch để xóa nhiều documents
        batch = []

        # Xóa tất cả ảnh liên quan
        images_ref = images_collection.find({"product_id": product_id})
        for image in await images_ref.to_list(None):
            batch.append({"d": {"_id": image["_id"]}})

        # Xóa sản phẩm
        batch.append({"d": {"_id": ObjectId(product_id)}})

        # Thực hiện batch
        await images_collection.bulk_write(batch)

        return {"message": "Product deleted successfully"}

    except Exception as e:
        logger.error(f"Error in delete_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 