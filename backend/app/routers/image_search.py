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

def normalize_percentage(value):
    """Chuẩn hóa giá trị về dạng phần trăm từ 0-100"""
    try:
        # Giới hạn giá trị trong khoảng 0-100
        return max(0, min(100, float(value)))
    except:
        return 0

@image_search_router.post("/search")
async def search_similar_images(
    file: UploadFile = File(..., description="Ảnh cần tìm kiếm"),
    company_id: str = Form(..., min_length=1),
    top_k: int = 6,
    current_user: dict = Depends(verify_token)
):
    try:
        # Đọc file ảnh
        image_content = await file.read()

        # Kiểm tra quyền truy cập company
        user = await users_collection.find_one({"_id": ObjectId(current_user["sub"])})
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin người dùng")
            
        # Chuyển company_id sang ObjectId để so sánh
        user_company_id = str(user.get('company_id'))
        if user_company_id != company_id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")

        # Lấy tất cả ảnh của company có image_hash
        images_cursor = images_collection.find({
            "company_id": ObjectId(company_id),
            "image_hash": {"$exists": True}
        })
        images_data = await images_cursor.to_list(None)

        if not images_data:
            return {
                "total": 0,
                "results": [],
                "message": "Không có ảnh để so sánh trong hệ thống"
            }

        # Xây dựng index cho tìm kiếm
        search_engine.build_index(images_data)
        
        # Tìm kiếm ảnh tương tự
        results = search_engine.find_similar_images_from_bytes(image_content, int(top_k))

        # Lấy thông tin sản phẩm cho mỗi kết quả
        enriched_results = []
        product_cache = {}

        for result in results:
            product_id = result['product_id']
            
            if product_id not in product_cache:
                product = await products_collection.find_one({"_id": ObjectId(product_id)})
                product_cache[product_id] = product
            else:
                product = product_cache[product_id]

            if product:
                # Tính độ tương đồng từ hamming_distance
                # Giá trị hamming_distance càng thấp thì độ tương đồng càng cao
                # Giả sử max hamming_distance là khoảng 1024 (32 features * 32 bytes * 8 bits)
                similarity = max(0, 100 - (result['hamming_distance'] / 81.92))
                
                enriched_results.append({
                    **result,
                    'similarity': round(similarity, 10),  # round(similarity, 10) Đổi từ hamming_distance sang similarity percentage
                    'product_name': product.get('product_name', ''),
                    'product_code': product.get('product_code', ''),
                    'price': float(product.get('price', 0)),
                    'brand': product.get('brand', ''),
                    'description': product.get('description', '')
                })

        return {
            "total": len(enriched_results),
            "results": enriched_results[:int(top_k)]
        }

    except Exception as e:
        logger.error(f"Error in search_similar_images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi tìm kiếm ảnh: {str(e)}") 