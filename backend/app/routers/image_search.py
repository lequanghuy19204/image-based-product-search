from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from app.middleware.auth_middleware import verify_token
from app.config.firebase_config import db
from app.utils.image_search import ImageSearchEngine
from typing import List
import logging
from pydantic import conint

logger = logging.getLogger(__name__)
image_search_router = APIRouter()

# Khởi tạo search engine
search_engine = ImageSearchEngine()

@image_search_router.post("/search")
async def search_similar_images(
    file: UploadFile = File(..., description="Ảnh cần tìm kiếm"),
    company_id: str = Form(..., min_length=1),
    top_k: int = Form(5, ge=1, le=20),
    current_user: dict = Depends(verify_token)
):
    try:
        # Đọc file ảnh
        image_content = await file.read()

        # Kiểm tra quyền truy cập company
        user_doc = db.collection('users').document(current_user["sub"]).get()
        user_data = user_doc.to_dict()
        if user_data.get('company_id') != company_id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")

        # Lấy tất cả ảnh của company
        images_ref = db.collection('images').where("company_id", "==", company_id)
        images = images_ref.get()
        
        # Chuyển đổi thành list
        images_data = []
        for img in images:
            img_data = img.to_dict()
            img_data['id'] = img.id
            images_data.append(img_data)

        # Xây dựng index
        search_engine.build_index(images_data)

        # Tìm kiếm ảnh tương tự
        results = search_engine.find_similar_images_from_bytes(image_content, top_k)

        # Lấy thông tin sản phẩm cho mỗi kết quả
        enriched_results = []
        seen_product_ids = set()  # Thêm set để theo dõi các product_id đã xử lý

        for result in results:
            product_id = result['product_id']
            # Kiểm tra nếu product_id đã tồn tại
            if product_id not in seen_product_ids:
                seen_product_ids.add(product_id)  # Thêm product_id vào set
                product_doc = db.collection('products').document(product_id).get()
                if product_doc.exists:
                    product_data = product_doc.to_dict()
                    enriched_results.append({
                        **result,
                        'product_name': product_data.get('product_name'),
                        'product_code': product_data.get('product_code'),
                        'price': product_data.get('price'),
                        'brand': product_data.get('brand'),
                        'description': product_data.get('description')
                    })

        return {
            "total": len(enriched_results),
            "results": enriched_results
        }

    except Exception as e:
        logger.error(f"Error in search_similar_images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 