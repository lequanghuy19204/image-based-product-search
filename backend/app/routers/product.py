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
from app.utils.permission import check_user_permission

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
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Tạo document sản phẩm mới
        product_dict = {
            "product_name": product_data.product_name,
            "product_code": product_data.product_code,
            "brand": product_data.brand or "",
            "description": product_data.description or "",
            "price": product_data.price,
            "company_id": ObjectId(product_data.company_id),  # Chuyển string thành ObjectId
            "image_urls": product_data.image_urls or [],
            "created_by": ObjectId(current_user["sub"]),  # Chuyển string thành ObjectId
            "created_by_name": user.get("username", "Unknown"),
            "colors": product_data.colors or "",  # Thêm trường colors
            "creator_name": product_data.creator_name or "",  # Thêm trường creator_name
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
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
                            "image_url": url,
                            "company_id": ObjectId(product_data.company_id),
                            "product_id": ObjectId(product_id),
                            "uploaded_by": ObjectId(current_user["sub"]),
                            "created_at": datetime.utcnow(),
                            "features": features,
                            "image_hash": image_hash
                        })

                if image_tasks:
                    await images_collection.insert_many(image_tasks)
                    
            except Exception as e:
                logger.error(f"Error processing images: {str(e)}")

        # Chạy xử lý ảnh bất đồng bộ
        asyncio.create_task(process_images())
        
        # Trả về response
        return {
            "id": product_id,
            **product_dict,
            "company_id": str(product_dict["company_id"]),
            "created_by": str(product_dict["created_by"])
        }

    except Exception as e:
        logger.error(f"Error in create_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/", response_model=dict)
async def get_products(
    current_user: dict = Depends(verify_token),
    search: str = None,
    search_field: str = 'code',
    page: int = 1,
    limit: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    try:
        # Thêm kiểm tra cache để tránh gọi DB nhiều lần
        cache_key = f"products_{current_user['sub']}_{page}_{limit}_{search}_{sort_by}_{sort_order}"
        
        # Lấy thông tin user
        user = await users_collection.find_one({"_id": ObjectId(current_user["sub"])})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Sử dụng company_id từ user
        user_company_id = user.get("company_id")
        if not user_company_id:
            raise HTTPException(status_code=400, detail="User's company information not found")

        # Tạo pipeline
        pipeline = [
            # Match stage - lọc theo company_id
            {
                "$match": {
                    "company_id": user_company_id  # Đã là ObjectId từ database
                }
            }
        ]

        # Thêm điều kiện tìm kiếm
        if search:
            search_filter = {}
            if search_field == 'code':
                search_filter["product_code"] = {"$regex": search, "$options": "i"}
            elif search_field == 'name':
                search_filter["product_name"] = {"$regex": search, "$options": "i"}
            elif search_field == 'creator':
                search_filter["created_by_name"] = {"$regex": search, "$options": "i"}
            elif search_field == 'price':
                try:
                    search_filter["price"] = float(search)
                except ValueError:
                    raise HTTPException(status_code=400, detail="Giá phải là số")
            
            if search_filter:
                pipeline.append({"$match": search_filter})

        # Thêm sort
        sort_direction = -1 if sort_order.lower() == "desc" else 1
        pipeline.append({"$sort": {sort_by: sort_direction}})

        # Thực hiện aggregation để đếm tổng số sản phẩm
        count_pipeline = pipeline.copy()
        count_pipeline.append({"$count": "total"})
        count_result = await products_collection.aggregate(count_pipeline).to_list(1)
        total = count_result[0]["total"] if count_result else 0

        # Thêm phân trang
        pipeline.extend([
            {"$skip": (page - 1) * limit},
            {"$limit": limit}
        ])

        # Project stage để format dữ liệu
        pipeline.append({
            "$project": {
                "_id": {"$toString": "$_id"},
                "product_name": 1,
                "product_code": 1,
                "brand": 1,
                "description": 1,
                "price": 1,
                "image_urls": 1,
                "created_at": 1,
                "updated_at": 1,
                "company_id": {"$toString": "$company_id"},
                "created_by": {"$toString": "$created_by"},
                "created_by_name": 1,
                "colors": 1,  # Thêm trường colors
                "creator_name": 1  # Thêm trường creator_name
            }
        })

        # Thực hiện aggregation chính
        products = await products_collection.aggregate(pipeline).to_list(None)

        # Format response
        formatted_products = []
        for product in products:
            formatted_product = {
                "id": product["_id"],
                "product_name": product["product_name"],
                "product_code": product["product_code"],
                "brand": product.get("brand", ""),
                "description": product.get("description", ""),
                "price": product["price"],
                "image_urls": product.get("image_urls", []),
                "created_by": product["created_by"],
                "created_by_name": product.get("created_by_name", ""),
                "colors": product.get("colors", ""),  # Thêm trường colors
                "creator_name": product.get("creator_name", ""),  # Thêm trường creator_name
                "created_at": product["created_at"].isoformat() if isinstance(product["created_at"], datetime) else product["created_at"],
                "updated_at": product["updated_at"].isoformat() if isinstance(product["updated_at"], datetime) else product["updated_at"],
                "company_id": product["company_id"]
            }
            formatted_products.append(formatted_product)

        return {
            "data": formatted_products,
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
        
        # Kiểm tra quyền
        await check_user_permission(current_user, product_doc["company_id"])
        
        # Lấy danh sách ảnh hiện tại
        current_images = set(product_doc.get('image_urls', []))
        new_images = set(product_data.image_urls or [])
        
        # Xác định ảnh bị xóa và ảnh mới
        deleted_images = current_images - new_images
        added_images = new_images - current_images

        # Xóa ảnh khỏi collection images
        if deleted_images:
            await images_collection.delete_many({
                "image_url": {"$in": list(deleted_images)},
                "product_id": ObjectId(product_id)
            })
            logger.info(f"Deleted {len(deleted_images)} images from images collection")

        # Xử lý ảnh mới
        for image_url in added_images:
            try:
                features, image_hash = process_image(image_url)
                if features is not None and image_hash is not None:
                    await images_collection.insert_one({
                        "image_url": image_url,
                        "company_id": product_doc["company_id"],  # Giữ nguyên ObjectId
                        "product_id": ObjectId(product_id),
                        "uploaded_by": ObjectId(current_user["sub"]),
                        "created_at": datetime.utcnow(),
                        "features": features.tolist() if hasattr(features, 'tolist') else features,
                        "image_hash": image_hash
                    })
                    logger.info(f"Added new image to images collection: {image_url}")
            except Exception as e:
                logger.error(f"Error processing image {image_url}: {str(e)}")
                continue

        # Cập nhật thông tin sản phẩm
        update_data = {
            "product_name": product_data.product_name,
            "product_code": product_data.product_code,
            "brand": product_data.brand or "",
            "description": product_data.description or "",
            "price": product_data.price,
            "image_urls": list(new_images),
            "colors": product_data.colors or product_doc.get("colors", ""),  # Cập nhật hoặc giữ nguyên colors
            "creator_name": product_data.creator_name or product_doc.get("creator_name", ""),  # Cập nhật hoặc giữ nguyên creator_name
            "updated_at": datetime.utcnow()
        }
        
        result = await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Product update failed")
            
        # Lấy sản phẩm đã cập nhật
        updated_product = await products_collection.find_one(
            {"_id": ObjectId(product_id)}
        )
        return ProductResponse(**updated_product)

    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Kiểm tra quyền
        await check_user_permission(current_user, product["company_id"])
        
        # Xóa tất cả ảnh liên quan trong collection images
        await images_collection.delete_many({
            "product_id": ObjectId(product_id)
        })
        logger.info(f"Deleted all images for product {product_id}")
        
        # Xóa sản phẩm
        result = await products_collection.delete_one({"_id": ObjectId(product_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Product deletion failed")
            
        return {
            "message": "Product and associated images deleted successfully",
            "deleted_product_id": product_id
        }
        
    except Exception as e:
        logger.error(f"Error deleting product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(
    product_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra sản phẩm tồn tại
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

        # Kiểm tra quyền truy cập
        await check_user_permission(current_user, product["company_id"])

        # Format response
        formatted_product = {
            "_id": str(product["_id"]),
            "product_name": product["product_name"],
            "product_code": product["product_code"],
            "brand": product.get("brand", ""),
            "description": product.get("description", ""),
            "price": product["price"],
            "image_urls": product.get("image_urls", []),
            "created_by": str(product["created_by"]),
            "created_by_name": product.get("created_by_name", ""),
            "colors": product.get("colors", ""),  # Thêm trường colors
            "creator_name": product.get("creator_name", ""),  # Thêm trường creator_name
            "created_at": product["created_at"].isoformat() if isinstance(product["created_at"], datetime) else product["created_at"],
            "updated_at": product["updated_at"].isoformat() if isinstance(product["updated_at"], datetime) else product["updated_at"],
            "company_id": str(product["company_id"])
        }

        return formatted_product

    except Exception as e:
        logger.error(f"Error getting product details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi lấy thông tin sản phẩm: {str(e)}") 