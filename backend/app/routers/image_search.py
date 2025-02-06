from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from app.middleware.auth_middleware import verify_token
from app.config.mongodb_config import users_collection, products_collection, images_collection
from app.utils.image_search import ImageSearchEngine
from typing import List
import logging
from pydantic import conint
from bson import ObjectId

logger = logging.getLogger(__name__)
image_search_router = APIRouter()

# Khởi tạo search engine
search_engine = ImageSearchEngine()

@image_search_router.post("/search")
async def search_similar_images(
    file: UploadFile = File(..., description="Ảnh cần tìm kiếm"),
    company_id: str = Form(..., min_length=1),
    top_k: int = Form(8, ge=1, le=20),
    current_user: dict = Depends(verify_token)
):
    try:
        # Đọc file ảnh
        image_content = await file.read()

        # Kiểm tra quyền truy cập company
        user = await users_collection.find_one({"_id": ObjectId(current_user["sub"])})
        if user.get('company_id') != company_id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")

        # Lấy tất cả ảnh của company
        images_cursor = images_collection.find({"company_id": company_id})
        images_data = await images_cursor.to_list(None)

        # Xây dựng index
        search_engine.build_index(images_data)

        # Tìm kiếm ảnh tương tự
        results = search_engine.find_similar_images_from_bytes(image_content, top_k)

        # Lấy thông tin sản phẩm cho mỗi kết quả
        enriched_results = []
        seen_product_ids = set()

        for result in results:
            product_id = result['product_id']
            if product_id not in seen_product_ids:
                seen_product_ids.add(product_id)
                product = await products_collection.find_one({"_id": ObjectId(product_id)})
                if product:
                    enriched_results.append({
                        **result,
                        'product_name': product.get('product_name'),
                        'product_code': product.get('product_code'),
                        'price': product.get('price'),
                        'brand': product.get('brand'),
                        'description': product.get('description')
                    })

        return {
            "total": len(enriched_results),
            "results": enriched_results
        }

    except Exception as e:
        logger.error(f"Error in search_similar_images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 