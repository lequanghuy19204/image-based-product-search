from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token, verify_admin
from app.config.mongodb_config import app_configs_collection, companies_collection, users_collection
from app.models.app_config import AppConfigCreate, AppConfigResponse
from datetime import datetime
from bson import ObjectId
from typing import List

app_config_router = APIRouter()

@app_config_router.post("/", response_model=AppConfigResponse)
async def create_app_config(
    config_data: AppConfigCreate,
    current_user: dict = Depends(verify_admin)  # Chỉ admin mới có quyền tạo
):
    try:
        # Kiểm tra company tồn tại
        company = await companies_collection.find_one({"_id": ObjectId(config_data.company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Không tìm thấy công ty")
            
        # Kiểm tra xem đã có cấu hình cho company này chưa
        existing_config = await app_configs_collection.find_one({"company_id": ObjectId(config_data.company_id)})
        if existing_config:
            raise HTTPException(status_code=400, detail="Đã tồn tại cấu hình cho công ty này")
            
        # Tạo document mới
        now = datetime.utcnow()
        new_config = {
            "company_id": ObjectId(config_data.company_id),
            "access_token": config_data.access_token,
            "version": config_data.version,
            "appId": config_data.appId,
            "businessId": config_data.businessId,
            "accessToken": config_data.accessToken,
            "depotId": config_data.depotId,
            "created_at": now,
            "updated_at": now
        }
        
        result = await app_configs_collection.insert_one(new_config)
        
        # Lấy document vừa tạo
        created_config = await app_configs_collection.find_one({"_id": result.inserted_id})
        
        return {
            **created_config,
            "id": str(created_config["_id"]),
            "company_id": str(created_config["company_id"])
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app_config_router.get("/{company_id}", response_model=AppConfigResponse)
async def get_app_config(
    company_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        # Kiểm tra company_id hợp lệ
        if not ObjectId.is_valid(company_id):
            raise HTTPException(status_code=400, detail="ID công ty không hợp lệ")
            
        # Tìm cấu hình
        config = await app_configs_collection.find_one({"company_id": ObjectId(company_id)})
        if not config:
            raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình cho công ty này")
            
        # Trả về kết quả
        return {
            **config,
            "id": str(config["_id"]),  # Đảm bảo trả về cả id và _id
            "company_id": str(config["company_id"])
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app_config_router.put("/{config_id}", response_model=AppConfigResponse)
async def update_app_config(
    config_id: str,
    config_data: AppConfigCreate,
    current_user: dict = Depends(verify_admin)
):
    try:
        # Kiểm tra cấu hình tồn tại
        config = await app_configs_collection.find_one({"_id": ObjectId(config_id)})
        if not config:
            raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình")
            
        # Cập nhật cấu hình
        update_data = {
            "access_token": config_data.access_token,
            "version": config_data.version,
            "appId": config_data.appId,
            "businessId": config_data.businessId,
            "accessToken": config_data.accessToken,
            "depotId": config_data.depotId,
            "updated_at": datetime.utcnow()
        }
        
        result = await app_configs_collection.update_one(
            {"_id": ObjectId(config_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Không thể cập nhật cấu hình")
            
        # Lấy cấu hình đã cập nhật
        updated_config = await app_configs_collection.find_one({"_id": ObjectId(config_id)})
        
        return {
            **updated_config,
            "id": str(updated_config["_id"]),
            "company_id": str(updated_config["company_id"])
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app_config_router.delete("/{config_id}")
async def delete_app_config(
    config_id: str,
    current_user: dict = Depends(verify_admin)
):
    try:
        # Kiểm tra cấu hình tồn tại
        config = await app_configs_collection.find_one({"_id": ObjectId(config_id)})
        if not config:
            raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình")
            
        # Xóa cấu hình
        result = await app_configs_collection.delete_one({"_id": ObjectId(config_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Không thể xóa cấu hình")
            
        return {"message": "Xóa cấu hình thành công"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 