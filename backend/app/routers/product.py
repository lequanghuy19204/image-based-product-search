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
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Sử dụng company_id từ user
        user_company_id = user.get("company_id")
        if not user_company_id:
            raise HTTPException(status_code=400, detail="User's company information not found")

        # Kiểm tra quyền truy cập
        if company_id and company_id != str(user_company_id):
            raise HTTPException(
                status_code=403, 
                detail="Không có quyền xem sản phẩm của công ty khác"
            )

        # Tạo pipeline
        pipeline = [
            # Match stage
            {
                "$match": {
                    "company_id": str(user_company_id)
                }
            },
            # Lookup stage để join với users collection
            {
                "$lookup": {
                    "from": "users",
                    "let": {"creator_id": "$created_by"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", {"$toObjectId": "$$creator_id"}]
                                }
                            }
                        }
                    ],
                    "as": "creator"
                }
            },
            # Unwind creator array
            {
                "$unwind": {
                    "path": "$creator",
                    "preserveNullAndEmptyArrays": True
                }
            },
            # Project stage để format dữ liệu
            {
                "$project": {
                    "id": {"$toString": "$_id"},
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
                    "created_by_name": "$creator.username"
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
                search_filter["creator.username"] = {"$regex": search, "$options": "i"}
            elif search_field == 'price':
                try:
                    search_filter["price"] = float(search)
                except ValueError:
                    raise HTTPException(status_code=400, detail="Giá phải là số")
            
            pipeline.insert(1, {"$match": search_filter})

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

        # Thực hiện aggregation chính
        products = await products_collection.aggregate(pipeline).to_list(None)

        # Format response
        formatted_products = []
        for product in products:
            formatted_product = {
                "id": str(product["_id"]),  # Chuyển ObjectId thành str
                "product_name": product["product_name"],
                "product_code": product["product_code"],
                "brand": product.get("brand"),
                "description": product.get("description"),
                "price": product["price"],
                "image_urls": product.get("image_urls", []),
                "created_by": str(product["created_by"]),  # Chuyển ObjectId thành str
                "created_by_name": product["created_by_name"],
                "created_at": product["created_at"],
                "updated_at": product["updated_at"],
                "company_id": str(product["company_id"])  # Chuyển ObjectId thành str
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